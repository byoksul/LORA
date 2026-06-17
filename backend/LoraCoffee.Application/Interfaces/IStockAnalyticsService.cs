using LoraCoffee.Application.DTOs;

namespace LoraCoffee.Application.Interfaces;

public interface IStockAnalyticsService
{
    Task<List<StockForecastDto>> GetForecastsAsync(CancellationToken cancellationToken = default);
    Task<StockDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, string>> GetUserNamesAsync(IEnumerable<Guid> userIds, CancellationToken cancellationToken = default);
}
