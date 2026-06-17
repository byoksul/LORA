using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;

namespace LoraCoffee.Application.Interfaces;

public interface IOrderStatusService
{
    Task<(Order? Order, string? ErrorMessage)> UpdateStatusAsync(
        Guid orderId, OrderStatus newStatus, Guid? userId, CancellationToken cancellationToken = default);
}
