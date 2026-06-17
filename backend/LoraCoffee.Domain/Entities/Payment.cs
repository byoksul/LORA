using LoraCoffee.Domain.Common;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Domain.Entities;

public class Payment : BaseEntity
{
    public Guid OrderId { get; set; }
    public PaymentType PaymentType { get; set; }
    public decimal Amount { get; set; }

    public Order Order { get; set; } = null!;
}
