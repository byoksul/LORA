using LoraCoffee.Domain.Common;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Domain.Entities;

public class StockMovement : BaseEntity
{
    public Guid StockItemId { get; set; }
    public StockMovementType MovementType { get; set; }
    public decimal Quantity { get; set; }
    public string? Notes { get; set; }

    public StockItem StockItem { get; set; } = null!;
}
