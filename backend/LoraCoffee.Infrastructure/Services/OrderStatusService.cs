using LoraCoffee.Application.Common;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using LoraCoffee.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace LoraCoffee.Infrastructure.Services;

public class OrderStatusService : IOrderStatusService
{
    private readonly ApplicationDbContext _context;
    private readonly IStockService _stockService;
    private readonly IStockMovementRepository _movementRepository;

    public OrderStatusService(
        ApplicationDbContext context,
        IStockService stockService,
        IStockMovementRepository movementRepository)
    {
        _context = context;
        _stockService = stockService;
        _movementRepository = movementRepository;
    }

    public async Task<(Order? Order, string? ErrorMessage)> UpdateStatusAsync(
        Guid orderId, OrderStatus newStatus, Guid? userId, CancellationToken cancellationToken = default)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .Include(o => o.Payments)
            .Include(o => o.Cashier)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order is null)
            return (null, "Sipariş bulunamadı.");

        if (!OrderStatusRules.CanTransition(order.Status, newStatus))
            return (null, $"Sipariş durumu {order.Status} → {newStatus} geçişi geçerli değil.");

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);

        try
        {
            if (newStatus == OrderStatus.Cancelled)
            {
                var alreadyRestored = await _movementRepository.HasCancelReturnForOrderAsync(orderId, cancellationToken);
                if (alreadyRestored)
                    return (null, "Bu siparişin stok iadesi zaten yapılmış.");

                await _stockService.RestoreStockForOrderAsync(orderId, userId, cancellationToken);
            }

            var fromStatus = order.Status;
            order.Status = newStatus;
            if (newStatus == OrderStatus.Ready)
                order.ReadyAt = DateTime.UtcNow;
            order.UpdatedDate = DateTime.UtcNow;
            order.UpdatedBy = userId;

            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                FromStatus = fromStatus,
                ToStatus = newStatus,
                ChangedById = userId
            });

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }

        return (order, null);
    }
}
