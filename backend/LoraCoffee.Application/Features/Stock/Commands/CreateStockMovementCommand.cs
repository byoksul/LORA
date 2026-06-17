using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Stock.Commands;

public record CreateStockMovementCommand(CreateStockMovementRequest Request) : IRequest<ApiResponse<StockMovementDto>>;

public class CreateStockMovementCommandHandler : IRequestHandler<CreateStockMovementCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStockMovementCommandHandler(
        IStockService stockService,
        IStockItemRepository stockRepository,
        IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(CreateStockMovementCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var stockItem = await _stockRepository.GetByIdAsync(request.StockItemId, cancellationToken);
        if (stockItem is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        var movementType = MapMovementType(request.MovementType);
        if (movementType is null)
            return new ApiResponse<StockMovementDto>(false, null, "Geçersiz hareket tipi.");

        try
        {
            var movement = await _stockService.ApplyMovementAsync(
                request.StockItemId, movementType.Value, request.Quantity,
                StockReferenceType.Manual, null, request.Notes, null, null, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(
                movement, stockItem.Name, stockItem.Unit, null));
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse<StockMovementDto>(false, null, ex.Message);
        }
    }

    private static StockMovementType? MapMovementType(string value)
    {
        if (Enum.TryParse<StockMovementType>(value, true, out var type))
            return type;

        if (string.Equals(value, "In", StringComparison.OrdinalIgnoreCase))
            return StockMovementType.ManualIn;

        if (string.Equals(value, "Out", StringComparison.OrdinalIgnoreCase))
            return StockMovementType.ManualOut;

        return null;
    }
}
