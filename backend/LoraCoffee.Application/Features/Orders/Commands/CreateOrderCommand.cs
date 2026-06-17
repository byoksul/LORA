using LoraCoffee.Application.Common;
using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Application.Mappings;
using MediatR;

namespace LoraCoffee.Application.Features.Orders.Commands;

public record CreateOrderCommand(CreateOrderRequest Request, Guid? CashierId) : IRequest<ApiResponse<OrderDto>>;

public class CreateOrderCommandHandler : IRequestHandler<CreateOrderCommand, ApiResponse<OrderDto>>
{
    private const decimal DiscountPercent = 25m;

    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderHubService _orderHubService;
    private readonly IStockService _stockService;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        IOrderHubService orderHubService,
        IStockService stockService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _orderHubService = orderHubService;
        _stockService = stockService;
    }

    public async Task<ApiResponse<OrderDto>> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (request.Items.Count == 0)
            return new ApiResponse<OrderDto>(false, null, "Sipariş en az bir ürün içermelidir.");

        var discountType = ParseDiscountType(request.DiscountType);
        if (discountType is null)
            return new ApiResponse<OrderDto>(false, null, $"Geçersiz indirim tipi: {request.DiscountType}");

        var orderNumber = await _orderRepository.GetNextOrderNumberAsync(cancellationToken);
        var order = new Order
        {
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Notes = request.Notes,
            CashierId = command.CashierId,
            IsSynced = true,
            DiscountType = discountType.Value
        };

        decimal subtotal = 0;
        var stockCheckItems = new List<(Product Product, int Quantity)>();

        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product is null || !product.IsActive)
                return new ApiResponse<OrderDto>(false, null, $"Ürün bulunamadı: {item.ProductId}");

            var unitPrice = ResolveUnitPrice(product, item.SizeLabel);
            if (unitPrice is null)
                return new ApiResponse<OrderDto>(false, null, $"Geçersiz boyut seçimi: {item.SizeLabel}");

            if (!string.IsNullOrWhiteSpace(item.MilkType) && !product.SupportsMilkChoice)
                return new ApiResponse<OrderDto>(false, null, $"{product.Name} için süt seçimi yapılamaz.");

            if (product.SupportsMilkChoice && !IsValidMilkType(item.MilkType))
                return new ApiResponse<OrderDto>(false, null, $"Geçersiz süt tipi: {item.MilkType}");

            var itemTotal = unitPrice.Value * item.Quantity;
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                SizeLabel = NormalizeSizeLabel(item.SizeLabel, product.PriceLarge),
                MilkType = NormalizeMilkType(item.MilkType, product.SupportsMilkChoice),
                Quantity = item.Quantity,
                UnitPrice = unitPrice.Value,
                TotalPrice = itemTotal
            });
            subtotal += itemTotal;

            if (product.TrackStock)
                stockCheckItems.Add((product, item.Quantity));
        }

        var stockError = await _stockService.ValidateStockForItemsAsync(stockCheckItems, cancellationToken);
        if (stockError is not null)
            return new ApiResponse<OrderDto>(false, null, stockError);

        order.SubtotalAmount = subtotal;

        if (discountType.Value is DiscountType.Student or DiscountType.HealthcareWorker)
        {
            var discountedTotal = Math.Round(subtotal * (100 - DiscountPercent) / 100m / 5m, 0, MidpointRounding.AwayFromZero) * 5m;
            order.TotalAmount = discountedTotal;
            order.DiscountAmount = subtotal - discountedTotal;
        }
        else
        {
            order.DiscountAmount = 0m;
            order.TotalAmount = subtotal;
        }

        if (order.TotalAmount <= 0)
            return new ApiResponse<OrderDto>(false, null, "Sipariş tutarı sıfırdan büyük olmalıdır.");

        var paymentTotal = request.Payments.Sum(p => p.Amount);
        if (paymentTotal <= 0)
            return new ApiResponse<OrderDto>(false, null, "Ödeme tutarı sıfırdan büyük olmalıdır.");

        if (paymentTotal != order.TotalAmount)
            return new ApiResponse<OrderDto>(false, null, $"Ödeme tutarı ({paymentTotal:N2}) sipariş tutarıyla ({order.TotalAmount:N2}) uyuşmuyor.");

        foreach (var payment in request.Payments)
        {
            if (!Enum.TryParse<PaymentType>(payment.PaymentType, true, out var paymentType))
                return new ApiResponse<OrderDto>(false, null, $"Geçersiz ödeme tipi: {payment.PaymentType}");

            order.Payments.Add(new Payment
            {
                PaymentType = paymentType,
                Amount = payment.Amount
            });
        }

        order.StatusHistory.Add(new OrderStatusHistory
        {
            FromStatus = OrderStatus.Pending,
            ToStatus = OrderStatus.Pending,
            ChangedById = command.CashierId
        });

        await _orderRepository.AddAsync(order, cancellationToken);
        await _stockService.DeductStockForOrderAsync(order, command.CashierId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _orderHubService.NotifyOrderCreated(order);

        return new ApiResponse<OrderDto>(true, OrderMapper.ToDto(order));
    }

    private static decimal? ResolveUnitPrice(Product product, string? sizeLabel)
    {
        if (product.PriceLarge is null)
            return product.Price;

        if (string.Equals(sizeLabel, "Küçük", StringComparison.OrdinalIgnoreCase))
            return product.Price;

        if (string.Equals(sizeLabel, "Büyük", StringComparison.OrdinalIgnoreCase))
            return product.PriceLarge;

        return null;
    }

    private static string? NormalizeSizeLabel(string? sizeLabel, decimal? priceLarge)
    {
        if (priceLarge is null) return null;
        return string.Equals(sizeLabel, "Büyük", StringComparison.OrdinalIgnoreCase) ? "Büyük" : "Küçük";
    }

    private static string? NormalizeMilkType(string? milkType, bool supportsMilkChoice)
    {
        if (!supportsMilkChoice) return null;
        return string.Equals(milkType, "LactoseFree", StringComparison.OrdinalIgnoreCase) ? "LactoseFree" : "Regular";
    }

    private static bool IsValidMilkType(string? milkType) =>
        string.IsNullOrWhiteSpace(milkType) ||
        string.Equals(milkType, "Regular", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(milkType, "LactoseFree", StringComparison.OrdinalIgnoreCase);

    private static DiscountType? ParseDiscountType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return DiscountType.None;

        return Enum.TryParse<DiscountType>(value, true, out var discountType)
            ? discountType
            : null;
    }
}
