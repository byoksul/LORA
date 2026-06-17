using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Services;

public class StockAnalyticsService : IStockAnalyticsService
{
    private readonly ApplicationDbContext _context;
    private readonly IStockItemRepository _stockRepository;

    public StockAnalyticsService(ApplicationDbContext context, IStockItemRepository stockRepository)
    {
        _context = context;
        _stockRepository = stockRepository;
    }

    public async Task<List<StockForecastDto>> GetForecastsAsync(CancellationToken cancellationToken = default)
    {
        var weekStart = DateTime.UtcNow.AddDays(-7);
        var saleOuts = await _context.StockMovements
            .AsNoTracking()
            .Where(m => m.MovementType == StockMovementType.SaleOut && m.CreatedDate >= weekStart)
            .GroupBy(m => m.StockItemId)
            .Select(g => new { StockItemId = g.Key, Total = g.Sum(m => m.Quantity) })
            .ToListAsync(cancellationToken);

        var saleMap = saleOuts.ToDictionary(x => x.StockItemId, x => x.Total / 7m);
        var items = await _context.StockItems.AsNoTracking().Where(s => s.IsActive).ToListAsync(cancellationToken);

        return items.Select(item =>
        {
            var dailyAvg = saleMap.GetValueOrDefault(item.Id);
            var hasData = dailyAvg > 0;
            decimal? remainingDays = hasData ? item.CurrentQuantity / dailyAvg : null;
            var message = hasData && remainingDays.HasValue
                ? $"{item.Name}: {item.CurrentQuantity:N1} {item.Unit} kaldı, son 7 günlük ortalamaya göre yaklaşık {remainingDays:N1} gün sonra bitebilir."
                : "Tahmin için yeterli satış verisi yok.";

            return new StockForecastDto(
                item.Id, item.Name, item.Unit, item.CurrentQuantity,
                hasData ? dailyAvg : null, remainingDays, hasData, message);
        }).ToList();
    }

    public async Task<StockDashboardDto> GetDashboardAsync(CancellationToken cancellationToken = default)
    {
        var todayStart = DateTime.UtcNow.Date;
        var critical = await _stockRepository.GetCriticalStockAsync(cancellationToken);

        var todayMovements = await _context.StockMovements
            .AsNoTracking()
            .Include(m => m.StockItem)
            .Where(m => m.CreatedDate >= todayStart)
            .ToListAsync(cancellationToken);

        var todaySaleOut = todayMovements.Where(m => m.MovementType == StockMovementType.SaleOut).ToList();
        var todayWaste = todayMovements
            .Where(m => m.MovementType == StockMovementType.WasteOut)
            .Sum(m => m.Quantity);

        var topConsumed = todaySaleOut
            .GroupBy(m => m.StockItemId)
            .Select(g => new StockConsumptionDto(
                g.Key, g.First().StockItem.Name, g.First().StockItem.Unit, g.Sum(m => m.Quantity)))
            .OrderByDescending(x => x.TotalQuantity)
            .Take(5)
            .ToList();

        var forecasts = await GetForecastsAsync(cancellationToken);
        var expiringSoon = forecasts
            .Where(f => f.HasEnoughData && f.RemainingDays is <= 3m)
            .OrderBy(f => f.RemainingDays)
            .Take(5)
            .ToList();

        return new StockDashboardDto(
            critical.Count,
            todaySaleOut.Count,
            todayWaste,
            topConsumed,
            expiringSoon);
    }

    public async Task<Dictionary<Guid, string>> GetUserNamesAsync(
        IEnumerable<Guid> userIds, CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0) return new Dictionary<Guid, string>();

        return await _context.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => $"{u.FirstName} {u.LastName}", cancellationToken);
    }
}
