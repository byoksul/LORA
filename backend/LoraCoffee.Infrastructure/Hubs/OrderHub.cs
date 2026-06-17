using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace LoraCoffee.Infrastructure.Hubs;

[Authorize(Roles = "SuperAdmin,Manager,Barista,Cashier")]
public class OrderHub : Hub
{
    public async Task JoinKitchen() => await Groups.AddToGroupAsync(Context.ConnectionId, "kitchen");
    public async Task JoinAdmin() => await Groups.AddToGroupAsync(Context.ConnectionId, "admin");
}
