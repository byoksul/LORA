using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Stock.Commands;

public record CreateStockMovementCommand(CreateStockMovementRequest Request) : IRequest<ApiResponse<StockMovementDto>>;

public class CreateStockMovementCommandHandler : IRequestHandler<CreateStockMovementCommand, ApiResponse<StockMovementDto>>
{
    private readonly IRepository<StockItem> _stockRepository;
    private readonly IRepository<StockMovement> _movementRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStockMovementCommandHandler(
        IRepository<StockItem> stockRepository,
        IRepository<StockMovement> movementRepository,
        IUnitOfWork unitOfWork)
    {
        _stockRepository = stockRepository;
        _movementRepository = movementRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(CreateStockMovementCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var stockItem = await _stockRepository.GetByIdAsync(request.StockItemId, cancellationToken);
        if (stockItem is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        if (!Enum.TryParse<StockMovementType>(request.MovementType, true, out var movementType))
            return new ApiResponse<StockMovementDto>(false, null, "Geçersiz hareket tipi.");

        if (movementType == StockMovementType.In)
            stockItem.CurrentQuantity += request.Quantity;
        else if (movementType == StockMovementType.Out)
            stockItem.CurrentQuantity -= request.Quantity;
        else
            stockItem.CurrentQuantity = request.Quantity;

        stockItem.UpdatedDate = DateTime.UtcNow;

        var movement = new StockMovement
        {
            StockItemId = request.StockItemId,
            MovementType = movementType,
            Quantity = request.Quantity,
            Notes = request.Notes
        };

        await _stockRepository.UpdateAsync(stockItem, cancellationToken);
        await _movementRepository.AddAsync(movement, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<StockMovementDto>(true, new StockMovementDto(
            movement.Id, movement.StockItemId, movement.MovementType.ToString(),
            movement.Quantity, movement.Notes, movement.CreatedDate));
    }
}
