using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ApplicationDbContext Context;
    protected readonly DbSet<T> DbSet;

    public Repository(ApplicationDbContext context)
    {
        Context = context;
        DbSet = context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await DbSet.FindAsync([id], cancellationToken);

    public async Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default)
        => await DbSet.ToListAsync(cancellationToken);

    public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
    {
        await DbSet.AddAsync(entity, cancellationToken);
        return entity;
    }

    public Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
    {
        // Zaten track edilen entity'de Update() tüm grafi Modified yapar → concurrency hatası
        if (Context.Entry(entity).State == EntityState.Detached)
            DbSet.Update(entity);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
    {
        DbSet.Remove(entity);
        return Task.CompletedTask;
    }
}

public class OrderRepository : Repository<Order>, IOrderRepository
{
    public OrderRepository(ApplicationDbContext context) : base(context) { }

    public async Task<int> GetNextOrderNumberAsync(CancellationToken cancellationToken = default)
    {
        var max = await DbSet.MaxAsync(o => (int?)o.OrderNumber, cancellationToken) ?? 100;
        return max + 1;
    }

    public async Task<IReadOnlyList<Order>> GetActiveOrdersAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .Include(o => o.Cashier)
            .Where(o => o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.CreatedDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Order>> GetOrdersByDateRangeAsync(DateTime start, DateTime end, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .Include(o => o.Cashier)
            .Where(o => o.CreatedDate >= start && o.CreatedDate <= end)
            .ToListAsync(cancellationToken);
    }

    public override async Task<Order?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .AsNoTracking()
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .Include(o => o.Cashier)
            .FirstOrDefaultAsync(o => o.Id == id, cancellationToken);
    }

    /// <summary>
    /// Sipariş durumunu change tracker olmadan günceller (concurrency hatası önlenir).
    /// </summary>
    public async Task<Order?> UpdateStatusAsync(
        Guid orderId,
        OrderStatus newStatus,
        Guid? changedById,
        CancellationToken cancellationToken = default)
    {
        Context.ChangeTracker.Clear();

        var snapshot = await DbSet
            .AsNoTracking()
            .Where(o => o.Id == orderId)
            .Select(o => new { o.Id, o.Status })
            .FirstOrDefaultAsync(cancellationToken);

        if (snapshot is null) return null;

        await using var transaction = await Context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            await Context.OrderStatusHistories.AddAsync(new OrderStatusHistory
            {
                OrderId = orderId,
                FromStatus = snapshot.Status,
                ToStatus = newStatus,
                ChangedById = changedById
            }, cancellationToken);

            var now = DateTime.UtcNow;

            int affected;
            if (newStatus == OrderStatus.Ready)
            {
                affected = await DbSet
                    .Where(o => o.Id == orderId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(o => o.Status, newStatus)
                            .SetProperty(o => o.ReadyAt, now)
                            .SetProperty(o => o.UpdatedDate, now)
                            .SetProperty(o => o.UpdatedBy, changedById),
                        cancellationToken);
            }
            else
            {
                affected = await DbSet
                    .Where(o => o.Id == orderId)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(o => o.Status, newStatus)
                            .SetProperty(o => o.UpdatedDate, now)
                            .SetProperty(o => o.UpdatedBy, changedById),
                        cancellationToken);
            }

            if (affected == 0)
            {
                await transaction.RollbackAsync(cancellationToken);
                return null;
            }

            await Context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        Context.ChangeTracker.Clear();
        return await GetByIdAsync(orderId, cancellationToken);
    }
}

public class ProductRepository : Repository<Product>, IProductRepository
{
    public ProductRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(p => p.Category)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Product>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.CategoryId == categoryId)
            .OrderBy(p => p.Name)
            .ToListAsync(cancellationToken);
    }
}

public class CategoryRepository : Repository<Category>, ICategoryRepository
{
    public CategoryRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(cancellationToken);
    }
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await DbSet.FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default)
    {
        return await DbSet.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
    }
}

public class StockItemRepository : Repository<StockItem>, IStockItemRepository
{
    public StockItemRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IReadOnlyList<StockItem>> GetCriticalStockAsync(CancellationToken cancellationToken = default)
    {
        return await DbSet
            .Where(s => s.IsActive && s.CurrentQuantity <= s.CriticalLevel)
            .ToListAsync(cancellationToken);
    }
}

public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;

    public UnitOfWork(ApplicationDbContext context) => _context = context;

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        => await _context.SaveChangesAsync(cancellationToken);
}
