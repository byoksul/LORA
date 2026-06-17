using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Mappings;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace LoraCoffee.Infrastructure.Services;

public class OrderHubService : IOrderHubService
{
    private readonly IHubContext<OrderHub> _hubContext;

    public OrderHubService(IHubContext<OrderHub> hubContext) => _hubContext = hubContext;

    public async Task NotifyOrderCreated(Order order)
    {
        var dto = OrderMapper.ToDto(order);
        await _hubContext.Clients.All.SendAsync("OrderCreated", dto);
    }

    public async Task NotifyOrderStatusChanged(Order order)
    {
        var dto = OrderMapper.ToDto(order);
        await _hubContext.Clients.All.SendAsync("OrderStatusChanged", dto);
    }
}
