using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class ProductRecipe : BaseEntity
{
    public Guid ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public Product Product { get; set; } = null!;
    public ICollection<ProductRecipeItem> Items { get; set; } = new List<ProductRecipeItem>();
}
