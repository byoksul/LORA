using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Reports.Queries;

public record GetSalesReportQuery(DateTime? StartDate, DateTime? EndDate) : IRequest<ApiResponse<List<SalesReportDto>>>;
public record GetProductSalesReportQuery(DateTime? StartDate, DateTime? EndDate) : IRequest<ApiResponse<List<ProductSalesReportDto>>>;
public record GetStaffSalesReportQuery(DateTime? StartDate, DateTime? EndDate) : IRequest<ApiResponse<List<StaffSalesReportDto>>>;

public class GetSalesReportQueryHandler : IRequestHandler<GetSalesReportQuery, ApiResponse<List<SalesReportDto>>>
{
    private readonly IOrderRepository _orderRepository;

    public GetSalesReportQueryHandler(IOrderRepository orderRepository) => _orderRepository = orderRepository;

    public async Task<ApiResponse<List<SalesReportDto>>> Handle(GetSalesReportQuery request, CancellationToken cancellationToken)
    {
        var start = request.StartDate ?? DateTime.UtcNow.Date.AddDays(-7);
        var end = request.EndDate ?? DateTime.UtcNow;
        var orders = await _orderRepository.GetOrdersByDateRangeAsync(start, end, cancellationToken);
        var active = orders.Where(o => o.Status != OrderStatus.Cancelled).ToList();

        var reports = active
            .GroupBy(o => o.CreatedDate.Date)
            .Select(g => new SalesReportDto(
                g.Key,
                g.Count(),
                g.Sum(o => o.TotalAmount),
                g.Count() > 0 ? g.Sum(o => o.TotalAmount) / g.Count() : 0))
            .OrderBy(r => r.Date)
            .ToList();

        return new ApiResponse<List<SalesReportDto>>(true, reports);
    }
}

public class GetProductSalesReportQueryHandler : IRequestHandler<GetProductSalesReportQuery, ApiResponse<List<ProductSalesReportDto>>>
{
    private readonly IOrderRepository _orderRepository;

    public GetProductSalesReportQueryHandler(IOrderRepository orderRepository) => _orderRepository = orderRepository;

    public async Task<ApiResponse<List<ProductSalesReportDto>>> Handle(GetProductSalesReportQuery request, CancellationToken cancellationToken)
    {
        var start = request.StartDate ?? DateTime.UtcNow.Date.AddDays(-7);
        var end = request.EndDate ?? DateTime.UtcNow;
        var orders = await _orderRepository.GetOrdersByDateRangeAsync(start, end, cancellationToken);
        var active = orders.Where(o => o.Status != OrderStatus.Cancelled).ToList();

        var reports = active
            .SelectMany(o => o.Items)
            .GroupBy(i => i.ProductName)
            .Select(g => new ProductSalesReportDto(g.Key, g.Sum(i => i.Quantity), g.Sum(i => i.TotalPrice)))
            .OrderByDescending(r => r.Revenue)
            .ToList();

        return new ApiResponse<List<ProductSalesReportDto>>(true, reports);
    }
}

public class GetStaffSalesReportQueryHandler : IRequestHandler<GetStaffSalesReportQuery, ApiResponse<List<StaffSalesReportDto>>>
{
    private readonly IOrderRepository _orderRepository;

    public GetStaffSalesReportQueryHandler(IOrderRepository orderRepository) => _orderRepository = orderRepository;

    public async Task<ApiResponse<List<StaffSalesReportDto>>> Handle(GetStaffSalesReportQuery request, CancellationToken cancellationToken)
    {
        var start = request.StartDate ?? DateTime.UtcNow.Date.AddDays(-7);
        var end = request.EndDate ?? DateTime.UtcNow;
        var orders = await _orderRepository.GetOrdersByDateRangeAsync(start, end, cancellationToken);
        var active = orders.Where(o => o.Status != OrderStatus.Cancelled && o.Cashier is not null).ToList();

        var reports = active
            .GroupBy(o => o.Cashier!)
            .Select(g => new StaffSalesReportDto(
                $"{g.Key.FirstName} {g.Key.LastName}",
                g.Count(),
                g.Sum(o => o.TotalAmount)))
            .OrderByDescending(r => r.TotalRevenue)
            .ToList();

        return new ApiResponse<List<StaffSalesReportDto>>(true, reports);
    }
}
