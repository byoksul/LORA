using LoraCoffee.Domain.Common;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Domain.Entities;

public class OrderStatusHistory : BaseEntity
{
    public Guid OrderId { get; set; }
    public OrderStatus FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public Guid? ChangedById { get; set; }

    public Order Order { get; set; } = null!;
    public User? ChangedBy { get; set; }
}
