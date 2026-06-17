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

  public static async Task SeedAsync(IServiceProvider serviceProvider)
  {
    using var scope = serviceProvider.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    var environment = scope.ServiceProvider.GetRequiredService<IHostEnvironment>();

    await context.Database.MigrateAsync();

    // Ürünler veritabanından yönetilir; deploy sonrası katalog mevcut veriyi ezmez.
    if (!await context.Products.AnyAsync())
    {
      await SeedInitialMenuFromCatalogAsync(context);
      await SeedInitialStockAsync(context);
      await SeedInitialRecipesAsync(context);
    }
    else
    {
      await EnsureDefaultStockItemsAsync(context);
    }

    if (!await context.Users.AnyAsync())
      await SeedInitialUsersAsync(context, passwordHasher);

    if (environment.IsDevelopment())
      await EnsureDemoCredentialsAsync(context, passwordHasher);
  }

  private static async Task SeedInitialMenuFromCatalogAsync(ApplicationDbContext context)
  {
    foreach (var catalogCategory in MenuCatalog.Categories)
    {
      var category = new Category
      {
        Name = catalogCategory.Name,
        SortOrder = catalogCategory.SortOrder,
        IsActive = true
      };
      context.Categories.Add(category);
      await context.SaveChangesAsync();

      foreach (var catalogProduct in catalogCategory.Products)
      {
        context.Products.Add(new Product
        {
          Name = catalogProduct.Name,
          Description = catalogProduct.Description,
          Price = catalogProduct.Price,
          PriceLarge = catalogProduct.PriceLarge,
          SupportsMilkChoice = catalogProduct.SupportsMilkChoice,
          CategoryId = category.Id,
          ImageUrl = MenuProductImages.Get(catalogProduct.Name),
          IsActive = true
        });
      }
    }

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

  private static async Task SeedInitialStockAsync(ApplicationDbContext context)
  {
    foreach (var def in DefaultStockDefinitions())
    {
      context.StockItems.Add(new StockItem
      {
        Name = def.Name,
        Unit = def.Unit,
        CurrentQuantity = def.Qty,
        CriticalLevel = def.Critical,
        IsActive = true
      });
    }

    await context.SaveChangesAsync();
  }

  private static async Task EnsureDefaultStockItemsAsync(ApplicationDbContext context)
  {
    var changed = false;

    foreach (var def in DefaultStockDefinitions())
    {
      var exists = await context.StockItems.AnyAsync(s => s.Name == def.Name);
      if (exists) continue;

      context.StockItems.Add(new StockItem
      {
        Name = def.Name,
        Unit = def.Unit,
        CurrentQuantity = 0,
        CriticalLevel = def.Critical,
        IsActive = true
      });
      changed = true;
    }

    if (changed)
      await context.SaveChangesAsync();
  }

  private static async Task SeedInitialRecipesAsync(ApplicationDbContext context)
  {
    var stockMap = await context.StockItems.ToDictionaryAsync(s => s.Name, s => s.Id);

    var recipeDefs = new Dictionary<string, (string Name, (string Stock, decimal Qty, string Unit, bool Optional)[] Items)>
    {
      ["Espresso"] = ("Espresso Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
      ]),
      ["Americano"] = ("Americano Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
      ]),
      ["Latte"] = ("Latte Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Süt", 0.200m, "lt", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
      ]),
      ["Ice Latte"] = ("Ice Latte Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Süt", 0.250m, "lt", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
        ("Buz", 0.150m, "kg", false),
      ]),
      ["Cappuccino"] = ("Cappuccino Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Süt", 0.180m, "lt", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
      ]),
      ["Mocha"] = ("Mocha Reçetesi", [
        ("Kahve çekirdeği", 0.018m, "kg", false),
        ("Süt", 0.200m, "lt", false),
        ("Kakao", 0.010m, "kg", false),
        ("Çikolata sosu", 0.020m, "lt", false),
        ("Bardak", 1m, "adet", false),
        ("Kapak", 1m, "adet", false),
      ]),
    };

    foreach (var (productName, recipeDef) in recipeDefs)
    {
      var product = await context.Products.FirstOrDefaultAsync(p => p.Name == productName);
      if (product is null) continue;

      product.TrackStock = true;

      var recipe = new ProductRecipe
      {
        ProductId = product.Id,
        Name = recipeDef.Name,
        IsActive = true
      };
      context.ProductRecipes.Add(recipe);

      foreach (var item in recipeDef.Items)
      {
        if (!stockMap.TryGetValue(item.Stock, out var stockId)) continue;
        recipe.Items.Add(new ProductRecipeItem
        {
          StockItemId = stockId,
          Quantity = item.Qty,
          Unit = item.Unit,
          IsOptional = item.Optional
        });
      }
    }

    await context.SaveChangesAsync();
  }

  private static (string Name, string Unit, decimal Qty, decimal Critical)[] DefaultStockDefinitions() =>
  [
    ("Kahve çekirdeği", "kg", 15, 5),
    ("Süt", "lt", 20, 10),
    ("Bardak", "adet", 500, 100),
    ("Kapak", "adet", 400, 100),
    ("Buz", "kg", 50, 10),
    ("Şurup", "lt", 8, 3),
    ("Kakao", "kg", 5, 2),
    ("Çikolata sosu", "lt", 6, 2),
    ("Tatlı", "adet", 30, 10),
  ];

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
