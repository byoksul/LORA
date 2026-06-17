using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using LoraCoffee.Domain.Enums;
using MediatR;

namespace LoraCoffee.Application.Features.Users.Commands;

public class CreateUserCommandHandler : IRequestHandler<CreateUserCommand, ApiResponse<UserDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IUnitOfWork _unitOfWork;

    public CreateUserCommandHandler(IUserRepository userRepository, IPasswordHasher passwordHasher, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<UserDto>> Handle(CreateUserCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var existing = await _userRepository.GetByEmailAsync(request.Email, cancellationToken);
        if (existing is not null)
            return new ApiResponse<UserDto>(false, null, "Bu e-posta zaten kullanılıyor.");

        if (!Enum.TryParse<UserRole>(request.Role, true, out var role))
            return new ApiResponse<UserDto>(false, null, "Geçersiz rol.");

        var user = new User
        {
            Email = request.Email,
            PasswordHash = _passwordHasher.Hash(request.Password),
            FirstName = request.FirstName,
            LastName = request.LastName,
            Role = role,
            IsActive = true
        };

        await _userRepository.AddAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<UserDto>(true, new UserDto(
            user.Id, user.Email, user.FirstName, user.LastName, user.Role.ToString(), user.IsActive, user.LastLoginDate));
    }
}

public class UpdateUserCommandHandler : IRequestHandler<UpdateUserCommand, ApiResponse<UserDto>>
{
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUserCommandHandler(IUserRepository userRepository, IUnitOfWork unitOfWork)
    {
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<UserDto>> Handle(UpdateUserCommand command, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByIdAsync(command.Id, cancellationToken);
        if (user is null)
            return new ApiResponse<UserDto>(false, null, "Kullanıcı bulunamadı.");

        if (!Enum.TryParse<UserRole>(command.Request.Role, true, out var role))
            return new ApiResponse<UserDto>(false, null, "Geçersiz rol.");

        user.FirstName = command.Request.FirstName;
        user.LastName = command.Request.LastName;
        user.Role = role;
        user.IsActive = command.Request.IsActive;
        user.UpdatedDate = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<UserDto>(true, new UserDto(
            user.Id, user.Email, user.FirstName, user.LastName, user.Role.ToString(), user.IsActive, user.LastLoginDate));
    }
}

public record CreateUserCommand(CreateUserRequest Request) : IRequest<ApiResponse<UserDto>>;
public record UpdateUserCommand(Guid Id, UpdateUserRequest Request) : IRequest<ApiResponse<UserDto>>;
