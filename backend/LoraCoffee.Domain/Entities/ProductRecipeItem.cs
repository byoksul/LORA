using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class ProductRecipeItem : BaseEntity
{
    public Guid ProductRecipeId { get; set; }
    public Guid StockItemId { get; set; }
    public decimal Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public bool IsOptional { get; set; } = false;

    public ProductRecipe ProductRecipe { get; set; } = null!;
    public StockItem StockItem { get; set; } = null!;
}
