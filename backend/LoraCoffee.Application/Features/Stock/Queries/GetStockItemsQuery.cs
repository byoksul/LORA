using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Stock.Queries;

public record GetStockItemsQuery : IRequest<ApiResponse<List<StockItemDto>>>;

public class GetStockItemsQueryHandler : IRequestHandler<GetStockItemsQuery, ApiResponse<List<StockItemDto>>>
{
    private readonly IRepository<Domain.Entities.StockItem> _stockRepository;

    public GetStockItemsQueryHandler(IRepository<Domain.Entities.StockItem> stockRepository)
    {
        _stockRepository = stockRepository;
    }

    public async Task<ApiResponse<List<StockItemDto>>> Handle(GetStockItemsQuery request, CancellationToken cancellationToken)
    {
        var items = await _stockRepository.GetAllAsync(cancellationToken);
        var dtos = items.Select(s => new StockItemDto(
            s.Id, s.Name, s.Unit, s.CurrentQuantity, s.CriticalLevel, s.IsActive,
            s.CurrentQuantity <= s.CriticalLevel)).ToList();
        return new ApiResponse<List<StockItemDto>>(true, dtos);
    }
}
