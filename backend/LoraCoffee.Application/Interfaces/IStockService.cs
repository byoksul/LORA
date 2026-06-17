using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Application.Interfaces;

public interface IStockService
{
    Task<string?> ValidateStockForItemsAsync(
        IEnumerable<(Product Product, int Quantity)> items,
        CancellationToken cancellationToken = default);

    Task DeductStockForOrderAsync(Order order, Guid? userId, CancellationToken cancellationToken = default);

    Task<bool> RestoreStockForOrderAsync(Guid orderId, Guid? userId, CancellationToken cancellationToken = default);

    Task<StockMovement> ApplyMovementAsync(
        Guid stockItemId,
        StockMovementType movementType,
        decimal quantity,
        StockReferenceType referenceType,
        Guid? referenceId,
        string? notes,
        Guid? userId,
        PurchaseReceipt? purchaseReceipt = null,
        CancellationToken cancellationToken = default);
}
