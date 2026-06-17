using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Application.Common;

public static class OrderStatusRules
{
    private static readonly Dictionary<OrderStatus, HashSet<OrderStatus>> AllowedTransitions = new()
    {
        // Barista: Hazır = tamamlandı (Delivered)
        [OrderStatus.Pending] = [OrderStatus.Preparing, OrderStatus.Ready, OrderStatus.Delivered, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Ready, OrderStatus.Pending, OrderStatus.Delivered, OrderStatus.Cancelled],
        [OrderStatus.Ready] = [OrderStatus.Delivered, OrderStatus.Preparing, OrderStatus.Cancelled],
    };

    public static bool CanTransition(OrderStatus from, OrderStatus to)
    {
        if (from == to) return false;
        return AllowedTransitions.TryGetValue(from, out var allowed) && allowed.Contains(to);
    }
}
