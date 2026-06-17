using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class StockItem : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public decimal CurrentQuantity { get; set; }
    public decimal CriticalLevel { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<StockMovement> Movements { get; set; } = new List<StockMovement>();
}
