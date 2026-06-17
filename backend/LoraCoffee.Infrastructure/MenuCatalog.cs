namespace LoraCoffee.Infrastructure;

public static class MenuCatalog
{
    public record MenuCategory(string Name, int SortOrder, IReadOnlyList<MenuProduct> Products);

    public record MenuProduct(
        string Name,
        decimal Price,
        decimal? PriceLarge = null,
        bool SupportsMilkChoice = false,
        string? Description = null);

    public static readonly IReadOnlyList<MenuCategory> Categories =
    [
        new("Sıcak Kahveler", 1,
        [
            new("Espresso", 165, Description: "Tek shot espresso"),
            new("Double Espresso", 185, Description: "Çift shot espresso"),
            new("Macchiato", 190, SupportsMilkChoice: true),
            new("Filter", 190, 205),
            new("Americano", 190, 205),
            new("Black Eye", 200, 210),
            new("Cortado", 205, SupportsMilkChoice: true),
            new("Cappuccino", 185, SupportsMilkChoice: true),
            new("Flat White", 215, 245, SupportsMilkChoice: true),
            new("Latte", 205, 230, SupportsMilkChoice: true),
            new("Vanilla Latte", 230, 260, SupportsMilkChoice: true),
            new("Irish Latte", 230, 260, SupportsMilkChoice: true),
            new("Banana Latte", 230, 260, SupportsMilkChoice: true),
            new("Caramel Latte", 230, 260, SupportsMilkChoice: true),
            new("Strawberry Latte", 230, 260, SupportsMilkChoice: true),
            new("Pumpkin Spice Latte", 230, 260, SupportsMilkChoice: true),
            new("Caramel Macchiato", 235, 270, SupportsMilkChoice: true),
            new("Mocha", 235, 270, SupportsMilkChoice: true),
            new("White Mocha", 235, 270, SupportsMilkChoice: true),
            new("Salted Caramel Latte", 235, 270, SupportsMilkChoice: true),
            new("Mocha Nut's", 250, 290, SupportsMilkChoice: true),
            new("Coco Nut's", 230, 260, SupportsMilkChoice: true),
            new("Miel", 230, 260, SupportsMilkChoice: true),
            new("Türk Kahvesi", 115, 205),
        ]),
        new("Çay & Sıcak İçecekler", 2,
        [
            new("Bitki Çayları", 200),
            new("Demleme Çay", 100, 105),
            new("Chai Tea Latte", 210, 235, SupportsMilkChoice: true),
            new("Sıcak Çikolata", 210, 235, SupportsMilkChoice: true),
            new("Salep", 210, 235, SupportsMilkChoice: true),
        ]),
        new("Soğuk Kahveler", 3,
        [
            new("Frozen", 185, 245, SupportsMilkChoice: true),
            new("Frappe", 185, 245, SupportsMilkChoice: true),
            new("Ice Latte", 215, 245, SupportsMilkChoice: true, Description: "Buzlu latte"),
        ]),
        new("Soğuk İçecekler", 4,
        [
            new("Limonata", 170, 225),
            new("Cool Lime / Berry", 185, 245),
            new("Churchill", 100),
            new("Gazoz", 100),
            new("Sade Soda", 85),
            new("Meyveli Soda", 100),
            new("Su", 25, Description: "Şişe su"),
        ]),
        new("Sandviçler", 5,
        [
            new("Karamelize Soğanlı Tavuk Sandviç", 235),
            new("Mozarelle Sandviç", 185),
            new("Bazlama Sandviç", 185),
            new("Hindi Jambonlu Peynirli Baget", 185),
            new("Börek / Poğaça", 75),
        ]),
        new("Tatlılar", 6,
        [
            new("Vişneli Brown", 240),
            new("Beyaz Çikolatalı Brown", 260),
            new("Havuçlu Tarçınlı Kek", 260),
            new("Nutella Pie", 260),
            new("Cookies", 175),
            new("Marlenka Ballı Cevizli", 240),
            new("Bella Vista", 215),
            new("Cheesecake Lotus / Meyveli", 215),
            new("Protein Bar", 110),
        ]),
        new("Ekstralar", 7,
        [
            new("Şurup", 75),
            new("Espresso Shot", 75, Description: "Ekstra espresso shot"),
            new("Honey", 75, Description: "Bal"),
            new("Süt", 25, Description: "Ekstra süt"),
        ]),
    ];

    public static HashSet<string> AllProductNames() =>
        Categories.SelectMany(c => c.Products.Select(p => p.Name)).ToHashSet(StringComparer.OrdinalIgnoreCase);
}
