using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Stock.Commands;

public record CreateStockItemCommand(CreateStockItemRequest Request) : IRequest<ApiResponse<StockItemDto>>;
public record UpdateStockItemCommand(Guid Id, UpdateStockItemRequest Request) : IRequest<ApiResponse<StockItemDto>>;
public record ManualInCommand(Guid StockItemId, ManualMovementRequest Request, Guid? UserId) : IRequest<ApiResponse<StockMovementDto>>;
public record ManualOutCommand(Guid StockItemId, ManualMovementRequest Request, Guid? UserId) : IRequest<ApiResponse<StockMovementDto>>;
public record WasteCommand(Guid StockItemId, WasteEntryRequest Request, Guid? UserId) : IRequest<ApiResponse<StockMovementDto>>;
public record AdjustmentCommand(Guid StockItemId, AdjustmentRequest Request, Guid? UserId) : IRequest<ApiResponse<StockMovementDto>>;
public record PurchaseInCommand(Guid StockItemId, PurchaseEntryRequest Request, Guid? UserId) : IRequest<ApiResponse<StockMovementDto>>;

public class CreateStockItemCommandHandler : IRequestHandler<CreateStockItemCommand, ApiResponse<StockItemDto>>
{
    private readonly IStockItemRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateStockItemCommandHandler(IStockItemRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockItemDto>> Handle(CreateStockItemCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var item = new StockItem
        {
            Name = request.Name,
            Unit = request.Unit,
            CurrentQuantity = request.CurrentQuantity,
            CriticalLevel = request.CriticalLevel,
            IsActive = request.IsActive
        };

        await _repository.AddAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<StockItemDto>(true, StockItemMapper.ToDto(item));
    }
}

public static class StockItemMapper
{
    public static StockItemDto ToDto(StockItem item) => new(
        item.Id, item.Name, item.Unit, item.CurrentQuantity, item.CriticalLevel, item.IsActive,
        item.CurrentQuantity <= item.CriticalLevel);
}

public class UpdateStockItemCommandHandler : IRequestHandler<UpdateStockItemCommand, ApiResponse<StockItemDto>>
{
    private readonly IStockItemRepository _repository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateStockItemCommandHandler(IStockItemRepository repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockItemDto>> Handle(UpdateStockItemCommand command, CancellationToken cancellationToken)
    {
        var item = await _repository.GetByIdAsync(command.Id, cancellationToken);
        if (item is null)
            return new ApiResponse<StockItemDto>(false, null, "Stok kalemi bulunamadı.");

        var request = command.Request;
        item.Name = request.Name;
        item.Unit = request.Unit;
        item.CriticalLevel = request.CriticalLevel;
        item.IsActive = request.IsActive;
        item.UpdatedDate = DateTime.UtcNow;

        await _repository.UpdateAsync(item, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<StockItemDto>(true, StockItemMapper.ToDto(item));
    }
}

public class ManualInCommandHandler : IRequestHandler<ManualInCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ManualInCommandHandler(IStockService stockService, IStockItemRepository stockRepository, IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(ManualInCommand command, CancellationToken cancellationToken)
    {
        var item = await _stockRepository.GetByIdAsync(command.StockItemId, cancellationToken);
        if (item is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        var movement = await _stockService.ApplyMovementAsync(
            command.StockItemId, StockMovementType.ManualIn, command.Request.Quantity,
            StockReferenceType.Manual, null, command.Request.Notes, command.UserId, null, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(movement, item.Name, item.Unit, null));
    }
}

public class ManualOutCommandHandler : IRequestHandler<ManualOutCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ManualOutCommandHandler(IStockService stockService, IStockItemRepository stockRepository, IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(ManualOutCommand command, CancellationToken cancellationToken)
    {
        var item = await _stockRepository.GetByIdAsync(command.StockItemId, cancellationToken);
        if (item is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        try
        {
            var movement = await _stockService.ApplyMovementAsync(
                command.StockItemId, StockMovementType.ManualOut, command.Request.Quantity,
                StockReferenceType.Manual, null, command.Request.Notes, command.UserId, null, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(movement, item.Name, item.Unit, null));
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse<StockMovementDto>(false, null, ex.Message);
        }
    }
}

public class WasteCommandHandler : IRequestHandler<WasteCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public WasteCommandHandler(IStockService stockService, IStockItemRepository stockRepository, IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(WasteCommand command, CancellationToken cancellationToken)
    {
        var item = await _stockRepository.GetByIdAsync(command.StockItemId, cancellationToken);
        if (item is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        var notes = $"Fire: {command.Request.Reason}";
        if (!string.IsNullOrWhiteSpace(command.Request.Notes))
            notes += $" — {command.Request.Notes}";

        try
        {
            var movement = await _stockService.ApplyMovementAsync(
                command.StockItemId, StockMovementType.WasteOut, command.Request.Quantity,
                StockReferenceType.Waste, null, notes, command.UserId, null, cancellationToken);

            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(movement, item.Name, item.Unit, null));
        }
        catch (InvalidOperationException ex)
        {
            return new ApiResponse<StockMovementDto>(false, null, ex.Message);
        }
    }
}

public class AdjustmentCommandHandler : IRequestHandler<AdjustmentCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AdjustmentCommandHandler(IStockService stockService, IStockItemRepository stockRepository, IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(AdjustmentCommand command, CancellationToken cancellationToken)
    {
        var item = await _stockRepository.GetByIdAsync(command.StockItemId, cancellationToken);
        if (item is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        var movement = await _stockService.ApplyMovementAsync(
            command.StockItemId, StockMovementType.Adjustment, command.Request.CountedQuantity,
            StockReferenceType.Adjustment, null, command.Request.Notes, command.UserId, null, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(movement, item.Name, item.Unit, null));
    }
}

public class PurchaseInCommandHandler : IRequestHandler<PurchaseInCommand, ApiResponse<StockMovementDto>>
{
    private readonly IStockService _stockService;
    private readonly IStockItemRepository _stockRepository;
    private readonly IUnitOfWork _unitOfWork;

    public PurchaseInCommandHandler(IStockService stockService, IStockItemRepository stockRepository, IUnitOfWork unitOfWork)
    {
        _stockService = stockService;
        _stockRepository = stockRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<StockMovementDto>> Handle(PurchaseInCommand command, CancellationToken cancellationToken)
    {
        var item = await _stockRepository.GetByIdAsync(command.StockItemId, cancellationToken);
        if (item is null)
            return new ApiResponse<StockMovementDto>(false, null, "Stok kalemi bulunamadı.");

        var request = command.Request;
        var unitCost = request.UnitCost ?? 0m;
        var totalCost = request.TotalCost ?? (unitCost * request.Quantity);

        var receipt = new PurchaseReceipt
        {
            UnitCost = unitCost,
            TotalCost = totalCost,
            SupplierName = request.SupplierName,
            InvoiceNumber = request.InvoiceNumber,
            Notes = request.Notes
        };

        var movement = await _stockService.ApplyMovementAsync(
            command.StockItemId, StockMovementType.PurchaseIn, request.Quantity,
            StockReferenceType.Purchase, null, request.Notes, command.UserId, receipt, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return new ApiResponse<StockMovementDto>(true, StockMovementMapper.ToDto(movement, item.Name, item.Unit, null));
    }
}

public static class StockMovementMapper
{
    public static StockMovementDto ToDto(StockMovement m, string stockItemName, string unit, string? createdByName) => new(
        m.Id, m.StockItemId, stockItemName, unit, m.MovementType.ToString(),
        m.Quantity, m.PreviousQuantity, m.NewQuantity,
        m.ReferenceType?.ToString(), m.ReferenceId, m.Notes, createdByName, m.CreatedDate);
}
