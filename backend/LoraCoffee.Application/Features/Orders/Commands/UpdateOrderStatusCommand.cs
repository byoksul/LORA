using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Application.Mappings;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Orders.Commands;

public record UpdateOrderStatusCommand(Guid OrderId, string Status, Guid? UserId) : IRequest<ApiResponse<OrderDto>>;

public class UpdateOrderStatusCommandHandler : IRequestHandler<UpdateOrderStatusCommand, ApiResponse<OrderDto>>
{
    private readonly IOrderStatusService _orderStatusService;
    private readonly IOrderHubService _orderHubService;

    public UpdateOrderStatusCommandHandler(
        IOrderStatusService orderStatusService,
        IOrderHubService orderHubService)
    {
        _orderStatusService = orderStatusService;
        _orderHubService = orderHubService;
    }

    public async Task<ApiResponse<OrderDto>> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<OrderStatus>(command.Status, true, out var newStatus))
            return new ApiResponse<OrderDto>(false, null, "Geçersiz sipariş durumu.");

        var (order, error) = await _orderStatusService.UpdateStatusAsync(
            command.OrderId, newStatus, command.UserId, cancellationToken);

        if (order is null)
            return new ApiResponse<OrderDto>(false, null, error);

        await _orderHubService.NotifyOrderStatusChanged(order);

        return new ApiResponse<OrderDto>(true, OrderMapper.ToDto(order));
    }
}
