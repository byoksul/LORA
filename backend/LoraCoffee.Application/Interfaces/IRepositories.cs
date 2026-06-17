using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Application.Interfaces;

public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<T>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(T entity, CancellationToken cancellationToken = default);
    Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
}

public interface IOrderRepository : IRepository<Order>
{
    Task<int> GetNextOrderNumberAsync(CancellationToken cancellationToken = default);
    Task<Order?> UpdateStatusAsync(Guid orderId, OrderStatus newStatus, Guid? changedById, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetActiveOrdersAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Order>> GetOrdersByDateRangeAsync(DateTime start, DateTime end, CancellationToken cancellationToken = default);
}

public interface IProductRepository : IRepository<Product>
{
    Task<IReadOnlyList<Product>> GetActiveProductsAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetAllWithCategoryAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Product>> GetByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    Task<bool> HasOrderHistoryAsync(Guid productId, CancellationToken cancellationToken = default);
    Task DeleteWithRecipesAsync(Guid productId, CancellationToken cancellationToken = default);
}

public interface ICategoryRepository : IRepository<Category>
{
    Task<IReadOnlyList<Category>> GetActiveCategoriesAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Category>> GetAllOrderedAsync(CancellationToken cancellationToken = default);
    Task<bool> HasProductsAsync(Guid categoryId, CancellationToken cancellationToken = default);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<User?> GetByUsernameAsync(string username, CancellationToken cancellationToken = default);
}

public interface IStockItemRepository : IRepository<StockItem>
{
    Task<IReadOnlyList<StockItem>> GetCriticalStockAsync(CancellationToken cancellationToken = default);
}

public interface IStockMovementRepository : IRepository<StockMovement>
{
    Task<IReadOnlyList<StockMovement>> GetFilteredAsync(
        Guid? stockItemId,
        StockMovementType? movementType,
        StockReferenceType? referenceType,
        Guid? createdBy,
        DateTime? startDate,
        DateTime? endDate,
        CancellationToken cancellationToken = default);

    Task<bool> HasCancelReturnForOrderAsync(Guid orderId, CancellationToken cancellationToken = default);
}

public interface IProductRecipeRepository : IRepository<ProductRecipe>
{
    Task<ProductRecipe?> GetActiveByProductIdAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<ProductRecipe?> GetByProductIdWithItemsAsync(Guid productId, CancellationToken cancellationToken = default);
    Task<Dictionary<Guid, bool>> GetHasActiveRecipeMapAsync(CancellationToken cancellationToken = default);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

public interface IJwtTokenService
{
    string GenerateToken(User user);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}

public interface IOrderHubService
{
    Task NotifyOrderCreated(Order order);
    Task NotifyOrderStatusChanged(Order order);
}
