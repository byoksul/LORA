using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Mappings;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Orders.Queries;

public record GetActiveOrdersQuery : IRequest<ApiResponse<List<OrderDto>>>;

public class GetActiveOrdersQueryHandler : IRequestHandler<GetActiveOrdersQuery, ApiResponse<List<OrderDto>>>
{
    private readonly IOrderRepository _orderRepository;

    public GetActiveOrdersQueryHandler(IOrderRepository orderRepository)
    {
        _orderRepository = orderRepository;
    }

    public async Task<ApiResponse<List<OrderDto>>> Handle(GetActiveOrdersQuery request, CancellationToken cancellationToken)
    {
        var orders = await _orderRepository.GetActiveOrdersAsync(cancellationToken);
        var dtos = orders.Select(OrderMapper.ToDto).ToList();
        return new ApiResponse<List<OrderDto>>(true, dtos);
    }
}
