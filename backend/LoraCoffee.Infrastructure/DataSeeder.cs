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
    await SyncMenuAsync(context);
    await SyncStockAndRecipesAsync(context);

    if (environment.IsDevelopment())
      await EnsureDemoCredentialsAsync(context, passwordHasher);

    if (await context.Users.AnyAsync()) return;

    var superAdmin = new User
    {
      Username = "admin",
      Email = "admin@loracoffee.com",
      PasswordHash = passwordHasher.Hash("123456"),
      FirstName = "Super",
      LastName = "Admin",
      Role = UserRole.SuperAdmin,
      IsActive = true
    };

    var manager = new User
    {
      Username = "manager",
      Email = "manager@loracoffee.com",
      PasswordHash = passwordHasher.Hash("222222"),
      FirstName = "Şube",
      LastName = "Yöneticisi",
      Role = UserRole.Manager,
      IsActive = true
    };

    var cashier = new User
    {
      Username = "kasiyer",
      Email = "cashier@loracoffee.com",
      PasswordHash = passwordHasher.Hash("333333"),
      FirstName = "Kasiyer",
      LastName = "Demo",
      Role = UserRole.Cashier,
      IsActive = true
    };

    var barista = new User
    {
      Username = "barista",
      Email = "barista@loracoffee.com",
      PasswordHash = passwordHasher.Hash("444444"),
      FirstName = "Barista",
      LastName = "Demo",
      Role = UserRole.Barista,
      IsActive = true
    };

    context.Users.AddRange(superAdmin, manager, cashier, barista);

    var stockItems = new List<StockItem>
    {
      new() { Name = "Kahve çekirdeği", Unit = "kg", CurrentQuantity = 15, CriticalLevel = 5 },
      new() { Name = "Süt", Unit = "lt", CurrentQuantity = 20, CriticalLevel = 10 },
      new() { Name = "Bardak", Unit = "adet", CurrentQuantity = 500, CriticalLevel = 100 },
      new() { Name = "Kapak", Unit = "adet", CurrentQuantity = 400, CriticalLevel = 100 },
      new() { Name = "Buz", Unit = "kg", CurrentQuantity = 50, CriticalLevel = 10 },
      new() { Name = "Şurup", Unit = "lt", CurrentQuantity = 8, CriticalLevel = 3 },
      new() { Name = "Kakao", Unit = "kg", CurrentQuantity = 5, CriticalLevel = 2 },
      new() { Name = "Çikolata sosu", Unit = "lt", CurrentQuantity = 6, CriticalLevel = 2 },
      new() { Name = "Tatlı", Unit = "adet", CurrentQuantity = 30, CriticalLevel = 10 }
    };
    context.StockItems.AddRange(stockItems);

    await context.SaveChangesAsync();
  }

  private static async Task SyncMenuAsync(ApplicationDbContext context)
  {
    var catalogNames = MenuCatalog.AllProductNames();
    var changed = false;

    foreach (var catalogCategory in MenuCatalog.Categories)
    {
      var category = await context.Categories
        .FirstOrDefaultAsync(c => c.Name == catalogCategory.Name);

      if (category is null)
      {
        category = new Category
        {
          Name = catalogCategory.Name,
          SortOrder = catalogCategory.SortOrder,
          IsActive = true
        };
        context.Categories.Add(category);
        await context.SaveChangesAsync();
      }
      else if (category.SortOrder != catalogCategory.SortOrder || !category.IsActive)
      {
        category.SortOrder = catalogCategory.SortOrder;
        category.IsActive = true;
        category.UpdatedDate = DateTime.UtcNow;
        changed = true;
      }

      foreach (var catalogProduct in catalogCategory.Products)
      {
        var product = await context.Products
          .FirstOrDefaultAsync(p => p.Name == catalogProduct.Name);

        var imageUrl = MenuProductImages.Get(catalogProduct.Name);

        if (product is null)
        {
          context.Products.Add(new Product
          {
            Name = catalogProduct.Name,
            Description = catalogProduct.Description,
            Price = catalogProduct.Price,
            PriceLarge = catalogProduct.PriceLarge,
            SupportsMilkChoice = catalogProduct.SupportsMilkChoice,
            CategoryId = category.Id,
            ImageUrl = imageUrl,
            IsActive = true
          });
          changed = true;
          continue;
        }

        var needsUpdate =
          product.CategoryId != category.Id ||
          product.Price != catalogProduct.Price ||
          product.PriceLarge != catalogProduct.PriceLarge ||
          product.SupportsMilkChoice != catalogProduct.SupportsMilkChoice ||
          product.Description != catalogProduct.Description ||
          product.ImageUrl != imageUrl ||
          !product.IsActive;

        if (needsUpdate)
        {
          product.CategoryId = category.Id;
          product.Price = catalogProduct.Price;
          product.PriceLarge = catalogProduct.PriceLarge;
          product.SupportsMilkChoice = catalogProduct.SupportsMilkChoice;
          product.Description = catalogProduct.Description;
          product.ImageUrl = imageUrl;
          product.IsActive = true;
          product.UpdatedDate = DateTime.UtcNow;
          changed = true;
        }
      }
    }

    var allProducts = await context.Products.ToListAsync();

    foreach (var product in allProducts)
    {
      if (catalogNames.Contains(product.Name) || !product.IsActive) continue;

      product.IsActive = false;
      product.UpdatedDate = DateTime.UtcNow;
      changed = true;
    }

    var catalogCategoryNames = MenuCatalog.Categories.Select(x => x.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
    var allCategories = await context.Categories.ToListAsync();

    foreach (var category in allCategories)
    {
      if (catalogCategoryNames.Contains(category.Name) || !category.IsActive) continue;

      category.IsActive = false;
      category.UpdatedDate = DateTime.UtcNow;
      changed = true;
    }

    if (changed)
      await context.SaveChangesAsync();
  }

  private static async Task SyncStockAndRecipesAsync(ApplicationDbContext context)
  {
    var stockDefs = new (string Name, string Unit, decimal Qty, decimal Critical)[]
    {
      ("Kahve çekirdeği", "kg", 15, 5),
      ("Süt", "lt", 20, 10),
      ("Bardak", "adet", 500, 100),
      ("Kapak", "adet", 400, 100),
      ("Buz", "kg", 50, 10),
      ("Şurup", "lt", 8, 3),
      ("Kakao", "kg", 5, 2),
      ("Çikolata sosu", "lt", 6, 2),
      ("Tatlı", "adet", 30, 10),
    };

    foreach (var def in stockDefs)
    {
      var item = await context.StockItems.FirstOrDefaultAsync(s => s.Name == def.Name);
      if (item is null)
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
    }

    await context.SaveChangesAsync();

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
      product.UpdatedDate = DateTime.UtcNow;

      var recipe = await context.ProductRecipes
        .Include(r => r.Items)
        .FirstOrDefaultAsync(r => r.ProductId == product.Id);

      if (recipe is null)
      {
        recipe = new ProductRecipe
        {
          ProductId = product.Id,
          Name = recipeDef.Name,
          IsActive = true
        };
        context.ProductRecipes.Add(recipe);
      }

      if (recipe.Items.Count == 0)
      {
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
    }

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
