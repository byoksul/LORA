using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Auth.Commands;

public record LoginCommand(string Username, string Password) : IRequest<ApiResponse<LoginResponse>>;

public class LoginCommandHandler : IRequestHandler<LoginCommand, ApiResponse<LoginResponse>>
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public LoginCommandHandler(
        IUserRepository userRepository,
        IJwtTokenService jwtTokenService,
        IPasswordHasher passwordHasher,
        IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _jwtTokenService = jwtTokenService;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<LoginResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var username = request.Username.Trim();
        var user = await _userRepository.GetByUsernameAsync(username, cancellationToken);
        if (user is null && username.Contains('@'))
            user = await _userRepository.GetByEmailAsync(username, cancellationToken);

        if (user is null || !user.IsActive)
            return new ApiResponse<LoginResponse>(false, null, "Geçersiz kullanıcı adı veya şifre.");

        if (!_passwordHasher.Verify(request.Password, user.PasswordHash))
            return new ApiResponse<LoginResponse>(false, null, "Geçersiz kullanıcı adı veya şifre.");

        user.LastLoginDate = DateTime.UtcNow;
        user.UpdatedDate = DateTime.UtcNow;
        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var token = _jwtTokenService.GenerateToken(user);
        var userDto = new UserDto(user.Id, user.Email, user.FirstName, user.LastName, user.Role.ToString(), user.IsActive, user.LastLoginDate);

        return new ApiResponse<LoginResponse>(true, new LoginResponse(token, userDto));
    }
}
