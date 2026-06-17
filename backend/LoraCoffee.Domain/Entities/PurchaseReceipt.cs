using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class PurchaseReceipt : BaseEntity
{
    public Guid StockMovementId { get; set; }
    public decimal UnitCost { get; set; }
    public decimal TotalCost { get; set; }
    public string? SupplierName { get; set; }
    public string? InvoiceNumber { get; set; }
    public string? Notes { get; set; }

    public StockMovement StockMovement { get; set; } = null!;
}
