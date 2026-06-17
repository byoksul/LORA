using LoraCoffee.Application.Common;
using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Mappings;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, string Status, Guid? UserId) : IRequest<ApiResponse<OrderDto>>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, ApiResponse<OrderDto>>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderHubService _orderHubService;

    public UpdateOrderStatusCommandHandler(
        IOrderRepository orderRepository,
        IOrderHubService orderHubService)
    {
        _orderRepository = orderRepository;
        _orderHubService = orderHubService;
    }

    public async Task<ApiResponse<OrderDto>> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<OrderStatus>(command.Status, true, out var newStatus))
            return new ApiResponse<OrderDto>(false, null, "Geçersiz sipariş durumu.");

        var existingOrder = await _orderRepository.GetByIdAsync(command.OrderId, cancellationToken);
        if (existingOrder is null)
            return new ApiResponse<OrderDto>(false, null, "Sipariş bulunamadı.");

        if (!OrderStatusRules.CanTransition(existingOrder.Status, newStatus))
            return new ApiResponse<OrderDto>(false, null, $"Sipariş durumu {existingOrder.Status} → {newStatus} geçişi geçerli değil.");

        var updatedOrder = await _orderRepository.UpdateStatusAsync(
            command.OrderId,
            newStatus,
            command.UserId,
            cancellationToken);

        if (updatedOrder is null)
            return new ApiResponse<OrderDto>(false, null, "Sipariş bulunamadı.");

        await _orderHubService.NotifyOrderStatusChanged(updatedOrder);

        return new ApiResponse<OrderDto>(true, OrderMapper.ToDto(updatedOrder));
    }
}
