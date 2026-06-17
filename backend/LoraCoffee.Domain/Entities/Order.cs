using LoraCoffee.Domain.Common;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Domain.Entities;

public class Order : BaseEntity
{
    public int OrderNumber { get; set; }
    public OrderStatus Status { get; set; } = OrderStatus.Pending;
    public decimal SubtotalAmount { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.None;
    public decimal DiscountAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public bool IsSynced { get; set; } = true;
    public Guid? CashierId { get; set; }
    /// <summary>Barista "Hazır" işaretlediğinde set edilir — hazırlanma süresi için.</summary>
    public DateTime? ReadyAt { get; set; }

    public User? Cashier { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<OrderStatusHistory> StatusHistory { get; set; } = new List<OrderStatusHistory>();
}
