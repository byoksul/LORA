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
    private readonly IOrderRepository _orderRepository;
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IOrderHubService _orderHubService;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IProductRepository productRepository,
        IUnitOfWork unitOfWork,
        IOrderHubService orderHubService)
    {
        _orderRepository = orderRepository;
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
        _orderHubService = orderHubService;
    }

    public async Task<ApiResponse<OrderDto>> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        if (request.Items.Count == 0)
            return new ApiResponse<OrderDto>(false, null, "Sipariş en az bir ürün içermelidir.");

        var orderNumber = await _orderRepository.GetNextOrderNumberAsync(cancellationToken);
        var order = new Order
        {
            OrderNumber = orderNumber,
            Status = OrderStatus.Pending,
            Notes = request.Notes,
            CashierId = command.CashierId,
            IsSynced = true
        };

        decimal total = 0;
        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(item.ProductId, cancellationToken);
            if (product is null || !product.IsActive)
                return new ApiResponse<OrderDto>(false, null, $"Ürün bulunamadı: {item.ProductId}");

            var itemTotal = product.Price * item.Quantity;
            order.Items.Add(new OrderItem
            {
                ProductId = product.Id,
                ProductName = product.Name,
                Quantity = item.Quantity,
                UnitPrice = product.Price,
                TotalPrice = itemTotal
            });
            total += itemTotal;
        }

        order.TotalAmount = total;

        if (total <= 0)
            return new ApiResponse<OrderDto>(false, null, "Sipariş tutarı sıfırdan büyük olmalıdır.");

        var paymentTotal = request.Payments.Sum(p => p.Amount);
        if (paymentTotal <= 0)
            return new ApiResponse<OrderDto>(false, null, "Ödeme tutarı sıfırdan büyük olmalıdır.");

        if (paymentTotal != total)
            return new ApiResponse<OrderDto>(false, null, $"Ödeme tutarı ({paymentTotal:N2}) sipariş tutarıyla ({total:N2}) uyuşmuyor.");

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
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        await _orderHubService.NotifyOrderCreated(order);

        return new ApiResponse<OrderDto>(true, OrderMapper.ToDto(order));
    }

}
