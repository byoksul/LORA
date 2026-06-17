using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Users.Queries;

public record GetUsersQuery : IRequest<ApiResponse<List<UserDto>>>;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, ApiResponse<List<UserDto>>>
{
    private readonly IUserRepository _userRepository;

    public GetUsersQueryHandler(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<ApiResponse<List<UserDto>>> Handle(GetUsersQuery request, CancellationToken cancellationToken)
    {
        var users = await _userRepository.GetAllAsync(cancellationToken);
        var dtos = users.Select(u => new UserDto(
            u.Id, u.Email, u.FirstName, u.LastName, u.Role.ToString(), u.IsActive, u.LastLoginDate)).ToList();
        return new ApiResponse<List<UserDto>>(true, dtos);
    }
}
