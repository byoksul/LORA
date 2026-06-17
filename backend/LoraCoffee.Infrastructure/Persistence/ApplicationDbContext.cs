using LoraCoffee.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<ProductRecipe> ProductRecipes => Set<ProductRecipe>();
    public DbSet<ProductRecipeItem> ProductRecipeItems => Set<ProductRecipeItem>();
    public DbSet<PurchaseReceipt> PurchaseReceipts => Set<PurchaseReceipt>();
    public DbSet<OrderStatusHistory> OrderStatusHistories => Set<OrderStatusHistory>();
    public DbSet<UserSession> UserSessions => Set<UserSession>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Setting> Settings => Set<Setting>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Email).IsUnique();
            e.HasIndex(u => u.Username).IsUnique();
            e.Property(u => u.Username).HasMaxLength(50);
            e.Property(u => u.Email).HasMaxLength(256);
            e.Property(u => u.FirstName).HasMaxLength(100);
            e.Property(u => u.LastName).HasMaxLength(100);
        });

        modelBuilder.Entity<Category>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<Product>(e =>
        {
            e.Property(p => p.Name).HasMaxLength(200);
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.Property(p => p.PriceLarge).HasPrecision(18, 2);
            e.Property(p => p.StockQuantity).HasPrecision(18, 2);
            e.HasOne(p => p.Category).WithMany(c => c.Products).HasForeignKey(p => p.CategoryId);
        });

        modelBuilder.Entity<Order>(e =>
        {
            e.Property(o => o.SubtotalAmount).HasPrecision(18, 2);
            e.Property(o => o.DiscountAmount).HasPrecision(18, 2);
            e.Property(o => o.TotalAmount).HasPrecision(18, 2);
            e.HasIndex(o => o.OrderNumber).IsUnique();
            e.HasOne(o => o.Cashier).WithMany(u => u.Orders).HasForeignKey(o => o.CashierId);
        });

        modelBuilder.Entity<OrderItem>(e =>
        {
            e.Property(i => i.UnitPrice).HasPrecision(18, 2);
            e.Property(i => i.TotalPrice).HasPrecision(18, 2);
            e.HasOne(i => i.Order).WithMany(o => o.Items).HasForeignKey(i => i.OrderId);
            e.HasOne(i => i.Product).WithMany(p => p.OrderItems).HasForeignKey(i => i.ProductId);
        });

        modelBuilder.Entity<Payment>(e =>
        {
            e.Property(p => p.Amount).HasPrecision(18, 2);
            e.HasOne(p => p.Order).WithMany(o => o.Payments).HasForeignKey(p => p.OrderId);
        });

        modelBuilder.Entity<StockItem>(e =>
        {
            e.Property(s => s.CurrentQuantity).HasPrecision(18, 2);
            e.Property(s => s.CriticalLevel).HasPrecision(18, 2);
        });

        modelBuilder.Entity<StockMovement>(e =>
        {
            e.Property(m => m.Quantity).HasPrecision(18, 2);
            e.Property(m => m.PreviousQuantity).HasPrecision(18, 2);
            e.Property(m => m.NewQuantity).HasPrecision(18, 2);
            e.HasOne(m => m.StockItem).WithMany(s => s.Movements).HasForeignKey(m => m.StockItemId);
            e.HasIndex(m => new { m.ReferenceType, m.ReferenceId });
        });

        modelBuilder.Entity<ProductRecipe>(e =>
        {
            e.Property(r => r.Name).HasMaxLength(200);
            e.HasOne(r => r.Product).WithMany(p => p.Recipes).HasForeignKey(r => r.ProductId);
            e.HasIndex(r => r.ProductId);
        });

        modelBuilder.Entity<ProductRecipeItem>(e =>
        {
            e.Property(i => i.Quantity).HasPrecision(18, 2);
            e.Property(i => i.Unit).HasMaxLength(50);
            e.HasOne(i => i.ProductRecipe).WithMany(r => r.Items).HasForeignKey(i => i.ProductRecipeId);
            e.HasOne(i => i.StockItem).WithMany().HasForeignKey(i => i.StockItemId);
        });

        modelBuilder.Entity<PurchaseReceipt>(e =>
        {
            e.Property(p => p.UnitCost).HasPrecision(18, 2);
            e.Property(p => p.TotalCost).HasPrecision(18, 2);
            e.Property(p => p.SupplierName).HasMaxLength(200);
            e.Property(p => p.InvoiceNumber).HasMaxLength(100);
            e.HasOne(p => p.StockMovement).WithOne(m => m.PurchaseReceipt).HasForeignKey<PurchaseReceipt>(p => p.StockMovementId);
        });

        modelBuilder.Entity<OrderStatusHistory>(e =>
        {
            e.HasOne(h => h.Order).WithMany(o => o.StatusHistory).HasForeignKey(h => h.OrderId);
            e.HasOne(h => h.ChangedBy).WithMany().HasForeignKey(h => h.ChangedById);
        });

        modelBuilder.Entity<UserSession>(e =>
        {
            e.HasOne(s => s.User).WithMany(u => u.Sessions).HasForeignKey(s => s.UserId);
        });

        modelBuilder.Entity<Setting>(e =>
        {
            e.HasIndex(s => s.Key).IsUnique();
        });
    }
}
