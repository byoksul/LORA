using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using LoraCoffee.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace LoraCoffee.Infrastructure;

public static class DataSeeder
{
  private static readonly Dictionary<string, (string Username, string Pin)> DemoCredentials = new()
  {
    ["admin@loracoffee.com"] = ("admin", "123456"),
    ["manager@loracoffee.com"] = ("manager", "222222"),
    ["cashier@loracoffee.com"] = ("kasiyer", "333333"),
    ["barista@loracoffee.com"] = ("barista", "444444"),
  };

  private static readonly string[] LegacyDemoStockNames =
  [
    "Kahve çekirdeği",
    "Süt",
    "Bardak",
    "Kapak",
    "Buz",
    "Şurup",
    "Kakao",
    "Çikolata sosu",
    "Tatlı",
  ];

  public static async Task SeedAsync(IServiceProvider serviceProvider)
  {
    using var scope = serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var environment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

    await context.Database.MigrateAsync();
    await CleanupLegacyDemoStockAsync(context);

    if (!await context.Users.AnyAsync())
      await SeedInitialUsersAsync(context, passwordHasher);

    if (environment.IsDevelopment())
      await EnsureDemoCredentialsAsync(context, passwordHasher);
  }

  /// <summary>
  /// Eski demo stok kalemleri ve hammadde reçetelerini kaldırır.
  /// Ürün stokları (Product.StockQuantity) ve panelden eklenen özel stok kalemleri korunur.
  /// </summary>
  private static async Task CleanupLegacyDemoStockAsync(ApplicationDbContext context)
  {
    var legacyStockIds = await context.StockItems
      .Where(s => LegacyDemoStockNames.Contains(s.Name))
      .Select(s => s.Id)
      .ToListAsync();

    if (legacyStockIds.Count == 0) return;

    var legacyRecipeItems = await context.ProductRecipeItems
      .Where(i => legacyStockIds.Contains(i.StockItemId))
      .ToListAsync();
    if (legacyRecipeItems.Count > 0)
    {
      context.ProductRecipeItems.RemoveRange(legacyRecipeItems);
      await context.SaveChangesAsync();
    }

    var emptyRecipes = await context.ProductRecipes
      .Include(r => r.Items)
      .Where(r => !r.Items.Any())
      .ToListAsync();
    if (emptyRecipes.Count > 0)
    {
      context.ProductRecipes.RemoveRange(emptyRecipes);
      await context.SaveChangesAsync();
    }

    var movementIds = await context.StockMovements
      .Where(m => legacyStockIds.Contains(m.StockItemId))
      .Select(m => m.Id)
      .ToListAsync();

    if (movementIds.Count > 0)
    {
      var receipts = await context.PurchaseReceipts
        .Where(p => movementIds.Contains(p.StockMovementId))
        .ToListAsync();
      context.PurchaseReceipts.RemoveRange(receipts);
    }

    var movements = await context.StockMovements
      .Where(m => legacyStockIds.Contains(m.StockItemId))
      .ToListAsync();
    context.StockMovements.RemoveRange(movements);

    var items = await context.StockItems
      .Where(s => legacyStockIds.Contains(s.Id))
      .ToListAsync();
    context.StockItems.RemoveRange(items);

    await context.SaveChangesAsync();
  }

  private static async Task SeedInitialUsersAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
  {
    context.Users.AddRange(
      new User
      {
        Username = "admin",
        Email = "admin@loracoffee.com",
        PasswordHash = passwordHasher.Hash("123456"),
        FirstName = "Super",
        LastName = "Admin",
        Role = UserRole.SuperAdmin,
        IsActive = true
      },
      new User
      {
        Username = "manager",
        Email = "manager@loracoffee.com",
        PasswordHash = passwordHasher.Hash("222222"),
        FirstName = "Şube",
        LastName = "Yöneticisi",
        Role = UserRole.Manager,
        IsActive = true
      },
      new User
      {
        Username = "kasiyer",
        Email = "cashier@loracoffee.com",
        PasswordHash = passwordHasher.Hash("333333"),
        FirstName = "Kasiyer",
        LastName = "Demo",
        Role = UserRole.Cashier,
        IsActive = true
      },
      new User
      {
        Username = "barista",
        Email = "barista@loracoffee.com",
        PasswordHash = passwordHasher.Hash("444444"),
        FirstName = "Barista",
        LastName = "Demo",
        Role = UserRole.Barista,
        IsActive = true
      });

    await context.SaveChangesAsync();
  }

  private static async Task EnsureDemoCredentialsAsync(ApplicationDbContext context, IPasswordHasher passwordHasher)
  {
    var users = await context.Users.ToListAsync();
    var changed = false;

    foreach (var user in users)
    {
      if (!DemoCredentials.TryGetValue(user.Email, out var cred)) continue;

      if (string.IsNullOrWhiteSpace(user.Username))
      {
        user.Username = cred.Username;
        user.UpdatedDate = DateTime.UtcNow;
        changed = true;
      }

      if (!PasswordHasher.IsBcryptHash(user.PasswordHash) ||
          !passwordHasher.Verify(cred.Pin, user.PasswordHash))
      {
        user.PasswordHash = passwordHasher.Hash(cred.Pin);
        user.UpdatedDate = DateTime.UtcNow;
        changed = true;
      }
    }

    if (changed)
      await context.SaveChangesAsync();
  }
}
