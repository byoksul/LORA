using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Repositories;

public class StockMovementRepository : Repository<StockMovement>, IStockMovementRepository
{
    public StockMovementRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IReadOnlyList<StockMovement>> GetFilteredAsync(
        Guid? stockItemId,
        StockMovementType? movementType,
        StockReferenceType? referenceType,
        Guid? createdBy,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default)
    {
        var query = DbSet
            .AsNoTracking()
            .Include(m => m.StockItem)
            .AsQueryable();

        if (stockItemId.HasValue)
            query = query.Where(m => m.StockItemId == stockItemId.Value);

        if (movementType.HasValue)
            query = query.Where(m => m.MovementType == movementType.Value);

        if (referenceType.HasValue)
            query = query.Where(m => m.ReferenceType == referenceType.Value);

        if (createdBy.HasValue)
            query = query.Where(m => m.CreatedBy == createdBy.Value);

        if (startDate.HasValue)
            query = query.Where(m => m.CreatedDate >= startDate.Value);

        if (endDate.HasValue)
            query = query.Where(m => m.CreatedDate <= endDate.Value);

        return await query
            .OrderByDescending(m => m.CreatedDate)
            .Take(500)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasCancelReturnForOrderAsync(Guid orderId, CancellationToken cancellationToken = default)
    {
        return await DbSet.AnyAsync(
            m => m.MovementType == StockMovementType.CancelReturn &&
                 m.ReferenceType == StockReferenceType.Order &&
                 m.ReferenceId == orderId,
            cancellationToken);
    }
}

public class ProductRecipeRepository : Repository<ProductRecipe>, IProductRecipeRepository
{
    public ProductRecipeRepository(ApplicationDbContext context) : base(context) { }

    public async Task<ProductRecipe?> GetActiveByProductIdAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(r => r.Items)
            .ThenInclude(i => i.StockItem)
            .FirstOrDefaultAsync(r => r.ProductId == productId && r.IsActive, cancellationToken);
    }

    public async Task<ProductRecipe?> GetByProductIdWithItemsAsync(Guid productId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(r => r.Items)
            .ThenInclude(i => i.StockItem)
            .FirstOrDefaultAsync(r => r.ProductId == productId, cancellationToken);
    }

    public async Task<Dictionary<Guid, bool>> GetHasActiveRecipeMapAsync(CancellationToken cancellationToken = default)
    {
        var recipes = await DbSet
            .AsNoTracking()
            .Where(r => r.IsActive)
            .Select(r => r.ProductId)
            .ToListAsync(cancellationToken);

        return recipes.Distinct().ToDictionary(id => id, _ => true);
    }
}
