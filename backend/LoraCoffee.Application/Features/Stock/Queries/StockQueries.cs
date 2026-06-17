using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Features.Stock.Commands;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Stock.Queries;

public record GetStockItemsQuery : IRequest<ApiResponse<List<StockItemDto>>>;
public record GetStockMovementsQuery(
    Guid? StockItemId, string? MovementType, string? ReferenceType, Guid? CreatedBy,
    DateTime? StartDate, DateTime? EndDate) : IRequest<ApiResponse<List<StockMovementDto>>>;
public record GetStockAlertsQuery : IRequest<ApiResponse<List<StockAlertDto>>>;
public record GetStockForecastQuery : IRequest<ApiResponse<List<StockForecastDto>>>;
public record GetStockDashboardQuery : IRequest<ApiResponse<StockDashboardDto>>;

public class GetStockItemsQueryHandler : IRequestHandler<GetStockItemsQuery, ApiResponse<List<StockItemDto>>>
{
    private readonly IStockItemRepository _repository;

    public GetStockItemsQueryHandler(IStockItemRepository repository) => _repository = repository;

    public async Task<ApiResponse<List<StockItemDto>>> Handle(GetStockItemsQuery request, CancellationToken cancellationToken)
    {
        var items = await _repository.GetAllAsync(cancellationToken);
        var dtos = items.Select(i => new StockItemDto(
            i.Id, i.Name, i.Unit, i.CurrentQuantity, i.CriticalLevel, i.IsActive,
            i.CurrentQuantity <= i.CriticalLevel)).ToList();
        return new ApiResponse<List<StockItemDto>>(true, dtos);
    }
}

public class GetStockMovementsQueryHandler : IRequestHandler<GetStockMovementsQuery, ApiResponse<List<StockMovementDto>>>
{
    private readonly IStockMovementRepository _repository;
    private readonly IStockAnalyticsService _analytics;

    public GetStockMovementsQueryHandler(IStockMovementRepository repository, IStockAnalyticsService analytics)
    {
        _repository = repository;
        _analytics = analytics;
    }

    public async Task<ApiResponse<List<StockMovementDto>>> Handle(GetStockMovementsQuery request, CancellationToken cancellationToken)
    {
        StockMovementType? movementType = null;
        if (!string.IsNullOrWhiteSpace(request.MovementType) &&
            Enum.TryParse<StockMovementType>(request.MovementType, true, out var mt))
            movementType = mt;

        StockReferenceType? referenceType = null;
        if (!string.IsNullOrWhiteSpace(request.ReferenceType) &&
            Enum.TryParse<StockReferenceType>(request.ReferenceType, true, out var rt))
            referenceType = rt;

        var movements = await _repository.GetFilteredAsync(
            request.StockItemId, movementType, referenceType, request.CreatedBy,
            request.StartDate, request.EndDate, cancellationToken);

        var userIds = movements.Where(m => m.CreatedBy.HasValue).Select(m => m.CreatedBy!.Value);
        var users = await _analytics.GetUserNamesAsync(userIds, cancellationToken);

        var dtos = movements.Select(m => StockMovementMapper.ToDto(
            m, m.StockItem.Name, m.StockItem.Unit,
            m.CreatedBy.HasValue ? users.GetValueOrDefault(m.CreatedBy.Value) : null)).ToList();

        return new ApiResponse<List<StockMovementDto>>(true, dtos);
    }
}

public class GetStockAlertsQueryHandler : IRequestHandler<GetStockAlertsQuery, ApiResponse<List<StockAlertDto>>>
{
    private readonly IStockItemRepository _repository;

    public GetStockAlertsQueryHandler(IStockItemRepository repository) => _repository = repository;

    public async Task<ApiResponse<List<StockAlertDto>>> Handle(GetStockAlertsQuery request, CancellationToken cancellationToken)
    {
        var critical = await _repository.GetCriticalStockAsync(cancellationToken);
        var dtos = critical.Select(i => new StockAlertDto(
            i.Id, i.Name, i.Unit, i.CurrentQuantity, i.CriticalLevel, true)).ToList();
        return new ApiResponse<List<StockAlertDto>>(true, dtos);
    }
}

public class GetStockForecastQueryHandler : IRequestHandler<GetStockForecastQuery, ApiResponse<List<StockForecastDto>>>
{
    private readonly IStockAnalyticsService _analytics;

    public GetStockForecastQueryHandler(IStockAnalyticsService analytics) => _analytics = analytics;

    public async Task<ApiResponse<List<StockForecastDto>>> Handle(GetStockForecastQuery request, CancellationToken cancellationToken)
    {
        var forecasts = await _analytics.GetForecastsAsync(cancellationToken);
        return new ApiResponse<List<StockForecastDto>>(true, forecasts);
    }
}

public class GetStockDashboardQueryHandler : IRequestHandler<GetStockDashboardQuery, ApiResponse<StockDashboardDto>>
{
    private readonly IStockAnalyticsService _analytics;

    public GetStockDashboardQueryHandler(IStockAnalyticsService analytics) => _analytics = analytics;

    public async Task<ApiResponse<StockDashboardDto>> Handle(GetStockDashboardQuery request, CancellationToken cancellationToken)
    {
        var dashboard = await _analytics.GetDashboardAsync(cancellationToken);
        return new ApiResponse<StockDashboardDto>(true, dashboard);
    }
}
