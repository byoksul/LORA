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
  private static readonly Dictionary<string, string> ProductImageUrls = new()
  {
    ["Espresso"] = "https://images.unsplash.com/photo-1775512825412-6a94a01b99ef?w=800&h=800&fit=crop&auto=format&q=85",
    ["Americano"] = "https://images.unsplash.com/photo-1551030173-122aabc4489c?w=800&h=800&fit=crop&auto=format&q=85",
    ["Latte"] = "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=800&fit=crop&auto=format&q=85",
    ["Cappuccino"] = "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&h=800&fit=crop&auto=format&q=85",
    ["Ice Latte"] = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=800&fit=crop&auto=format&q=85",
    ["Ice Americano"] = "https://images.unsplash.com/photo-1621221814951-fa755dd0c993?w=800&h=800&fit=crop&auto=format&q=85",
    ["San Sebastian"] = "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&h=800&fit=crop&auto=format&q=85",
    ["Tiramisu"] = "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800&h=800&fit=crop&auto=format&q=85",
    ["Su"] = "https://images.unsplash.com/photo-1628035280603-74ca33b17259?w=800&h=800&fit=crop&auto=format&q=85",
    ["Limonata"] = "https://images.unsplash.com/photo-1631308492942-3a713d7fd02e?w=800&h=800&fit=crop&auto=format&q=85",
  };

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
    await UpdateProductImagesAsync(context);

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

    var categories = new List<Category>
    {
      new() { Name = "Kahveler", SortOrder = 1, IsActive = true },
      new() { Name = "Soğuk Kahveler", SortOrder = 2, IsActive = true },
      new() { Name = "Tatlılar", SortOrder = 3, IsActive = true },
      new() { Name = "İçecekler", SortOrder = 4, IsActive = true }
    };
    context.Categories.AddRange(categories);
    await context.SaveChangesAsync();

    var products = ProductImageUrls.Select(kvp => new Product
    {
      Name = kvp.Key,
      Description = GetProductDescription(kvp.Key),
      Price = GetProductPrice(kvp.Key),
      CategoryId = GetCategoryId(kvp.Key, categories),
      ImageUrl = kvp.Value,
      IsActive = true
    }).ToList();

    context.Products.AddRange(products);

    var stockItems = new List<StockItem>
    {
      new() { Name = "Kahve", Unit = "kg", CurrentQuantity = 15, CriticalLevel = 5 },
      new() { Name = "Süt", Unit = "lt", CurrentQuantity = 20, CriticalLevel = 10 },
      new() { Name = "Bardak", Unit = "adet", CurrentQuantity = 500, CriticalLevel = 100 },
      new() { Name = "Kapak", Unit = "adet", CurrentQuantity = 400, CriticalLevel = 100 },
      new() { Name = "Şurup", Unit = "lt", CurrentQuantity = 8, CriticalLevel = 3 },
      new() { Name = "Tatlılar", Unit = "adet", CurrentQuantity = 30, CriticalLevel = 10 }
    };
    context.StockItems.AddRange(stockItems);

    await context.SaveChangesAsync();
  }

  private static async Task UpdateProductImagesAsync(ApplicationDbContext context)
  {
    var products = await context.Products.ToListAsync();
    foreach (var product in products)
    {
      if (!ProductImageUrls.TryGetValue(product.Name, out var url)) continue;

      var needsUpdate = string.IsNullOrWhiteSpace(product.ImageUrl)
        || product.ImageUrl != url
        || product.ImageUrl.Contains("c7c8b0c8c8c8")
        || product.ImageUrl.Contains("w=400");

      if (needsUpdate)
      {
        product.ImageUrl = url;
        product.UpdatedDate = DateTime.UtcNow;
      }
    }

    if (products.Count > 0)
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

  private static string GetProductDescription(string name) => new Dictionary<string, string>
  {
    ["Espresso"] = "Yoğun ve aromatik tek shot espresso",
    ["Americano"] = "Espresso ve sıcak su",
    ["Latte"] = "Espresso ve kremsi süt",
    ["Cappuccino"] = "Espresso, süt ve süt köpüğü",
    ["Ice Latte"] = "Soğuk latte, buzlu",
    ["Ice Americano"] = "Soğuk americano",
    ["San Sebastian"] = "Kremalı cheesecake",
    ["Tiramisu"] = "İtalyan tiramisu",
    ["Su"] = "500ml su",
    ["Limonata"] = "Taze sıkılmış limonata",
  }.GetValueOrDefault(name, "");

  private static decimal GetProductPrice(string name) => new Dictionary<string, decimal>
  {
    ["Espresso"] = 85,
    ["Americano"] = 95,
    ["Latte"] = 110,
    ["Cappuccino"] = 110,
    ["Ice Latte"] = 120,
    ["Ice Americano"] = 105,
    ["San Sebastian"] = 145,
    ["Tiramisu"] = 135,
    ["Su"] = 25,
    ["Limonata"] = 75,
  }.GetValueOrDefault(name, 0);

  private static Guid GetCategoryId(string name, List<Category> categories)
  {
    if (name is "Ice Latte" or "Ice Americano") return categories[1].Id;
    if (name is "San Sebastian" or "Tiramisu") return categories[2].Id;
    if (name is "Su" or "Limonata") return categories[3].Id;
    return categories[0].Id;
  }
}
