namespace LoraCoffee.Infrastructure;

/// <summary>
/// Her menü ürünü için Unsplash aramasından seçilmiş, doğrulanmış görsel.
/// Kaynak: https://images.unsplash.com
/// </summary>
public static class MenuProductImages
{
    private const string Q = "?w=800&h=800&fit=crop&auto=format&q=85";

    private static string U(string photoId) => $"https://images.unsplash.com/{photoId}{Q}";

    private static readonly Dictionary<string, string> Images = new(StringComparer.OrdinalIgnoreCase)
    {
        // Kahveler & sıcak
        ["Espresso"] = U("photo-1510591509098-f4fdc6d0ff04"),
        ["Double Espresso"] = U("photo-1553292218-4892c2e7e1ae"),
        ["Macchiato"] = U("photo-1485808191679-5f86510681a2"),
        ["Filter"] = U("photo-1497935586351-b67a49e012bf"),
        ["Americano"] = U("photo-1559496417-e7f25cb247f3"),
        ["Black Eye"] = U("photo-1579992357154-faf4bde95b3d"),
        ["Cortado"] = U("photo-1610889556528-9a770e32642f"),
        ["Cappuccino"] = U("photo-1534234757579-8ad69d218ad4"),
        ["Flat White"] = U("photo-1512568400610-62da28bc8a13"),
        ["Latte"] = U("photo-1531441802565-2948024f1b22"),
        ["Vanilla Latte"] = U("photo-1596952954288-16862d37405b"),
        ["Irish Latte"] = U("photo-1598908314732-07113901949e"),
        ["Banana Latte"] = U("photo-1623507318654-d4cca1c34b85"),
        ["Caramel Latte"] = U("photo-1578314675249-a6910f80cc4e"),
        ["Strawberry Latte"] = U("photo-1703957898966-242db2503775"),
        ["Pumpkin Spice Latte"] = U("photo-1592663527359-cf6642f54cff"),
        ["Caramel Macchiato"] = U("photo-1662047102608-a6f2e492411f"),
        ["Mocha"] = U("photo-1583165278997-0250ea5d72e2"),
        ["White Mocha"] = U("photo-1631679263367-9095fca628de"),
        ["Salted Caramel Latte"] = U("photo-1586277419671-f34cf56500a0"),
        ["Mocha Nut's"] = U("photo-1517701550927-30cf4ba1dba5"),
        ["Coco Nut's"] = U("photo-1553909489-cd47e0907980"),
        ["Miel"] = U("photo-1560155069-ad79768f2666"),
        ["Türk Kahvesi"] = U("photo-1576685880864-50b3b35f1c55"),
        ["Bitki Çayları"] = U("photo-1561041695-d2fadf9f318c"),
        ["Demleme Çay"] = U("photo-1603199939607-5bd820dae3eb"),
        ["Chai Tea Latte"] = U("photo-1578899952107-9c390f1af1b7"),
        ["Sıcak Çikolata"] = U("photo-1517578239113-b03992dcdd25"),
        ["Salep"] = U("photo-1661685249316-a06e692e1cb2"),

        // Sandviçler
        ["Karamelize Soğanlı Tavuk Sandviç"] = U("photo-1703219342329-fce8488cf443"),
        ["Mozarelle Sandviç"] = U("photo-1614800443187-cc573044fa19"),
        ["Bazlama Sandviç"] = U("photo-1664192579000-fe65c5692d22"),
        ["Hindi Jambonlu Peynirli Baget"] = U("photo-1566804770468-867f6158bda5"),
        ["Börek / Poğaça"] = U("photo-1658661521751-37eba144310a"),

        // Tatlılar
        ["Vişneli Brown"] = U("photo-1602526638273-1c16532650ee"),
        ["Beyaz Çikolatalı Brown"] = U("photo-1621800043295-a73fe2f76e2c"),
        ["Havuçlu Tarçınlı Kek"] = U("photo-1579888071069-c107a6f79d82"),
        ["Nutella Pie"] = U("photo-1584695278906-c3e1c250bf0d"),
        ["Cookies"] = U("photo-1498654364264-5e856b6bb047"),
        ["Marlenka Ballı Cevizli"] = U("photo-1607914770021-82956c49ec03"),
        ["Bella Vista"] = U("photo-1677694682771-f2a1eaa7b8d9"),
        ["Cheesecake Lotus / Meyveli"] = U("photo-1638519651608-412009302a02"),
        ["Protein Bar"] = U("photo-1591271300850-22d6784e0a7f"),

        // Soğuk içecekler
        ["Churchill"] = U("photo-1646257861487-60fa89bef25f"),
        ["Gazoz"] = U("photo-1625708458528-802ec79b1ed8"),
        ["Sade Soda"] = U("photo-1602143407151-7111542de6e8"),
        ["Meyveli Soda"] = U("photo-1616118132534-381148898bb4"),
        ["Su"] = U("photo-1633040243823-6bf8d4edb0ec"),

        // Frozen & soğuk özel
        ["Frozen"] = U("photo-1461023058943-07fcbe16d735"),
        ["Frappe"] = U("photo-1574782256243-69c18023f7b4"),
        ["Limonata"] = U("photo-1656936637945-571e3f0893f9"),
        ["Cool Lime / Berry"] = U("photo-1728466708408-3957e54cf3de"),

        // Ekstralar
        ["Şurup"] = U("photo-1517701604599-bb29b565090c"),
        ["Espresso Shot"] = U("photo-1572286258217-40142c1c6a70"),
        ["Honey"] = U("photo-1587393855524-087f83d95bc9"),
        ["Süt"] = U("photo-1568966299181-bb7282cc84f0"),

    };

    public static string Get(string productName) =>
        Images.TryGetValue(productName, out var url)
            ? url
            : U("photo-1495474472287-4d71bcdd2085");

    public static IReadOnlyDictionary<string, string> All => Images;
}