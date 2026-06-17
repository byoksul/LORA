using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class Product : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? PriceLarge { get; set; }
    public bool SupportsMilkChoice { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public bool TrackStock { get; set; } = false;
    public Guid CategoryId { get; set; }

    public Category Category { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<ProductRecipe> Recipes { get; set; } = new List<ProductRecipe>();
}
