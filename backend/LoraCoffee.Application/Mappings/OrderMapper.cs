using LoraCoffee.Application.DTOs;
using LoraCoffee.Domain.Entities;

namespace LoraCoffee.Application.Mappings;

public static class OrderMapper
{
    public static OrderDto ToDto(Order order) => new(
        order.Id,
        order.OrderNumber,
        order.Status.ToString(),
        order.TotalAmount,
        order.Notes,
        order.CreatedDate,
        order.ReadyAt,
        order.Items.Select(i => new OrderItemDto(i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.TotalPrice)).ToList(),
        order.Payments.Select(p => new PaymentDto(p.Id, p.PaymentType.ToString(), p.Amount)).ToList()
    );
}
