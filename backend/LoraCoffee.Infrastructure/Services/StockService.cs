using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Services;

public class StockService : IStockService
{
    private readonly ApplicationDbContext _context;

    public StockService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<string?> ValidateStockForItemsAsync(
        IEnumerable<(Product Product, int Quantity)> items,
        CancellationToken cancellationToken = default)
    {
        var itemList = items.ToList();

        foreach (var (product, quantity) in itemList)
        {
            if (!product.TrackStock) continue;

            if (await UsesRecipeStockAsync(product.Id, cancellationToken)) continue;

            if (product.StockQuantity < quantity)
            {
                return $"{product.Name} için yeterli stok yok. Mevcut: {product.StockQuantity:N0} adet, İstenen: {quantity}.";
            }
        }

        var requirements = await BuildRequirementsAsync(itemList, cancellationToken);
        foreach (var req in requirements)
        {
            var stockItem = await _context.StockItems
                .FirstOrDefaultAsync(s => s.Id == req.StockItemId && s.IsActive, cancellationToken);

            if (stockItem is null) continue;

            if (stockItem.CurrentQuantity < req.RequiredQuantity)
            {
                return $"{req.ProductName} için yeterli {stockItem.Name} yok. Gerekli: {req.RequiredQuantity:N2} {stockItem.Unit}, Mevcut: {stockItem.CurrentQuantity:N2} {stockItem.Unit}.";
            }
        }

        return null;
    }

    public async Task DeductStockForOrderAsync(Order order, Guid? userId, CancellationToken cancellationToken = default)
    {
        var items = order.Items.Select(i => new OrderItemWithProduct(i, null)).ToList();
        var productIds = items.Select(i => i.Item.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, cancellationToken);

        foreach (var wrapper in items)
        {
            var product = products.GetValueOrDefault(wrapper.Item.ProductId);
            if (product is null || !product.TrackStock) continue;
            if (await UsesRecipeStockAsync(product.Id, cancellationToken)) continue;

            product.StockQuantity -= wrapper.Item.Quantity;
            product.UpdatedDate = DateTime.UtcNow;
            product.UpdatedBy = userId;
        }

        var orderItems = items.Select(i =>
        {
            i.Product = products.GetValueOrDefault(i.Item.ProductId);
            return (i.Product!, i.Item.Quantity);
        }).Where(x => x.Item1 is not null && x.Item1.TrackStock).ToList();

        var requirements = await BuildRequirementsAsync(
            orderItems.Select(x => (x.Item1, x.Item2)),
            cancellationToken);

        foreach (var req in requirements)
        {
            var stockItem = await _context.StockItems
                .FirstAsync(s => s.Id == req.StockItemId, cancellationToken);

            var previous = stockItem.CurrentQuantity;
            stockItem.CurrentQuantity -= req.RequiredQuantity;
            stockItem.UpdatedDate = DateTime.UtcNow;
            stockItem.UpdatedBy = userId;

            _context.StockMovements.Add(new StockMovement
            {
                StockItemId = stockItem.Id,
                MovementType = StockMovementType.SaleOut,
                Quantity = req.RequiredQuantity,
                PreviousQuantity = previous,
                NewQuantity = stockItem.CurrentQuantity,
                ReferenceType = StockReferenceType.Order,
                ReferenceId = order.Id,
                Notes = $"Sipariş #{order.OrderNumber}",
                CreatedBy = userId
            });
        }
    }

    public async Task<bool> RestoreStockForOrderAsync(Guid orderId, Guid? userId, CancellationToken cancellationToken = default)
    {
        var hasCancel = await _context.StockMovements.AnyAsync(
            m => m.MovementType == StockMovementType.CancelReturn &&
                 m.ReferenceType == StockReferenceType.Order &&
                 m.ReferenceId == orderId,
            cancellationToken);

        if (hasCancel) return false;

        var saleMovements = await _context.StockMovements
            .Where(m => m.MovementType == StockMovementType.SaleOut &&
                        m.ReferenceType == StockReferenceType.Order &&
                        m.ReferenceId == orderId)
            .ToListAsync(cancellationToken);

        foreach (var sale in saleMovements)
        {
            var stockItem = await _context.StockItems
                .FirstAsync(s => s.Id == sale.StockItemId, cancellationToken);

            var previous = stockItem.CurrentQuantity;
            stockItem.CurrentQuantity += sale.Quantity;
            stockItem.UpdatedDate = DateTime.UtcNow;
            stockItem.UpdatedBy = userId;

            _context.StockMovements.Add(new StockMovement
            {
                StockItemId = stockItem.Id,
                MovementType = StockMovementType.CancelReturn,
                Quantity = sale.Quantity,
                PreviousQuantity = previous,
                NewQuantity = stockItem.CurrentQuantity,
                ReferenceType = StockReferenceType.Order,
                ReferenceId = orderId,
                Notes = $"Sipariş iptali - #{orderId}",
                CreatedBy = userId
            });
        }

        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is not null)
        {
            var productIds = order.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, cancellationToken);

            foreach (var item in order.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product) || !product.TrackStock) continue;
                if (await UsesRecipeStockAsync(product.Id, cancellationToken)) continue;

                product.StockQuantity += item.Quantity;
                product.UpdatedDate = DateTime.UtcNow;
                product.UpdatedBy = userId;
            }
        }

        return true;
    }

    public async Task<StockMovement> ApplyMovementAsync(
        Guid stockItemId,
        StockMovementType movementType,
        decimal quantity,
        StockReferenceType referenceType,
        Guid? referenceId,
        string? notes,
        Guid? userId,
        PurchaseReceipt? purchaseReceipt = null,
        CancellationToken cancellationToken = default)
    {
        var stockItem = await _context.StockItems
            .FirstAsync(s => s.Id == stockItemId, cancellationToken);

        var previous = stockItem.CurrentQuantity;
        decimal newQty;

        switch (movementType)
        {
            case StockMovementType.PurchaseIn:
            case StockMovementType.ManualIn:
            case StockMovementType.ReturnIn:
            case StockMovementType.CancelReturn:
                newQty = previous + quantity;
                break;
            case StockMovementType.ManualOut:
            case StockMovementType.SaleOut:
            case StockMovementType.WasteOut:
                if (previous < quantity)
                    throw new InvalidOperationException($"Yetersiz stok. Mevcut: {previous:N2} {stockItem.Unit}");
                newQty = previous - quantity;
                break;
            case StockMovementType.Adjustment:
                newQty = quantity;
                break;
            default:
                throw new InvalidOperationException("Geçersiz hareket tipi.");
        }

        stockItem.CurrentQuantity = newQty;
        stockItem.UpdatedDate = DateTime.UtcNow;
        stockItem.UpdatedBy = userId;

        var movement = new StockMovement
        {
            StockItemId = stockItemId,
            MovementType = movementType,
            Quantity = movementType == StockMovementType.Adjustment
                ? newQty - previous
                : quantity,
            PreviousQuantity = previous,
            NewQuantity = newQty,
            ReferenceType = referenceType,
            ReferenceId = referenceId,
            Notes = notes,
            CreatedBy = userId
        };

        _context.StockMovements.Add(movement);

        if (purchaseReceipt is not null)
        {
            purchaseReceipt.StockMovement = movement;
            _context.PurchaseReceipts.Add(purchaseReceipt);
        }

        return movement;
    }

    private async Task<bool> UsesRecipeStockAsync(Guid productId, CancellationToken cancellationToken)
    {
        var recipe = await _context.ProductRecipes
            .Include(r => r.Items)
            .FirstOrDefaultAsync(r => r.ProductId == productId && r.IsActive, cancellationToken);

        return recipe is not null && recipe.Items.Any(i => !i.IsOptional);
    }

    private async Task<List<StockRequirement>> BuildRequirementsAsync(
        IEnumerable<(Product Product, int Quantity)> items,
        CancellationToken cancellationToken)
    {
        var result = new Dictionary<Guid, StockRequirement>();

        foreach (var (product, quantity) in items)
        {
            if (!product.TrackStock) continue;
            if (!await UsesRecipeStockAsync(product.Id, cancellationToken)) continue;

            var recipe = await _context.ProductRecipes
                .Include(r => r.Items)
                .FirstAsync(r => r.ProductId == product.Id && r.IsActive, cancellationToken);

            foreach (var recipeItem in recipe.Items.Where(i => !i.IsOptional))
            {
                var required = recipeItem.Quantity * quantity;
                if (result.TryGetValue(recipeItem.StockItemId, out var existing))
                {
                    existing.RequiredQuantity += required;
                }
                else
                {
                    result[recipeItem.StockItemId] = new StockRequirement(
                        recipeItem.StockItemId,
                        product.Name,
                        required);
                }
            }
        }

        return result.Values.ToList();
    }

    private sealed class OrderItemWithProduct
    {
        public OrderItem Item { get; }
        public Product? Product { get; set; }

        public OrderItemWithProduct(OrderItem item, Product? product)
        {
            Item = item;
            Product = product;
        }
    }

    private sealed class StockRequirement
    {
        public Guid StockItemId { get; }
        public string ProductName { get; }
        public decimal RequiredQuantity { get; set; }

        public StockRequirement(Guid stockItemId, string productName, decimal requiredQuantity)
        {
            StockItemId = stockItemId;
            ProductName = productName;
            RequiredQuantity = requiredQuantity;
        }
    }
}
