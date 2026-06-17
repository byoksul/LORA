using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Dashboard.Queries;

public record GetDashboardQuery : IRequest<ApiResponse<DashboardDto>>;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, ApiResponse<DashboardDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IStockAnalyticsService _stockAnalytics;

    public GetDashboardQueryHandler(IOrderRepository orderRepository, IStockAnalyticsService stockAnalytics)
    {
        _orderRepository = orderRepository;
        _stockAnalytics = stockAnalytics;
    }

    public async Task<ApiResponse<DashboardDto>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = todayStart.AddDays(-7);
        var monthStart = todayStart.AddDays(-30);

        var monthOrders = await _orderRepository.GetOrdersByDateRangeAsync(monthStart, now, cancellationToken);
        var activeOrders = monthOrders.Where(o => o.Status != OrderStatus.Cancelled).ToList();

        var todayOrders = activeOrders.Where(o => o.CreatedDate >= todayStart).ToList();
        var weekOrders = activeOrders.Where(o => o.CreatedDate >= weekStart).ToList();

        var dailyRevenue = todayOrders.Sum(o => o.TotalAmount);
        var weeklyRevenue = weekOrders.Sum(o => o.TotalAmount);
        var monthlyRevenue = activeOrders.Sum(o => o.TotalAmount);
        var orderCount = todayOrders.Count;
        var averageBasket = orderCount > 0 ? dailyRevenue / orderCount : 0;

        var productSales = activeOrders
            .SelectMany(o => o.Items)
            .GroupBy(i => i.ProductName)
            .Select(g => new TopProductDto(g.Key, g.Sum(i => i.Quantity), g.Sum(i => i.TotalPrice)))
            .OrderByDescending(p => p.Quantity)
            .ToList();

        var topProducts = productSales.Take(5).ToList();
        var lowProducts = productSales.OrderBy(p => p.Quantity).Take(5).ToList();

        var hourlyTraffic = Enumerable.Range(0, 24)
            .Select(h => new HourlyDataDto(h, todayOrders.Count(o => o.CreatedDate.Hour == h)))
            .ToList();

        var payments = todayOrders.SelectMany(o => o.Payments).ToList();
        var paymentDistribution = new PaymentDistributionDto(
            payments.Where(p => p.PaymentType == PaymentType.Card).Sum(p => p.Amount),
            payments.Where(p => p.PaymentType == PaymentType.Cash).Sum(p => p.Amount),
            payments.Where(p => p.PaymentType == PaymentType.Complimentary).Sum(p => p.Amount)
        );

        var stockSummary = await _stockAnalytics.GetDashboardAsync(cancellationToken);

        var dashboard = new DashboardDto(
            dailyRevenue, weeklyRevenue, monthlyRevenue, orderCount, averageBasket,
            topProducts, lowProducts, hourlyTraffic, paymentDistribution, stockSummary);

        return new ApiResponse<DashboardDto>(true, dashboard);
    }
}
