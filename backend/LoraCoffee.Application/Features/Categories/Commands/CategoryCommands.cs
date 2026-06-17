using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using MediatR;

namespace LoraCoffee.Application.Features.Categories.Commands;

public record CreateCategoryRequest(string Name, string? Description, string? ImageUrl, int SortOrder, bool IsActive);
public record UpdateCategoryRequest(string Name, string? Description, string? ImageUrl, int SortOrder, bool IsActive);
public record CreateCategoryCommand(CreateCategoryRequest Request) : IRequest<ApiResponse<CategoryDto>>;
public record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<ApiResponse<CategoryDto>>;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, ApiResponse<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCategoryCommandHandler(ICategoryRepository categoryRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<CategoryDto>> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var category = new Category
        {
            Name = request.Name,
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            SortOrder = request.SortOrder,
            IsActive = request.IsActive
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<CategoryDto>(true, new CategoryDto(
            category.Id, category.Name, category.Description, category.ImageUrl, category.SortOrder, category.IsActive));
    }
}

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, ApiResponse<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCategoryCommandHandler(ICategoryRepository categoryRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<CategoryDto>> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(command.Id, cancellationToken);
        if (category is null)
            return new ApiResponse<CategoryDto>(false, null, "Kategori bulunamadı.");

        var request = command.Request;
        category.Name = request.Name;
        category.Description = request.Description;
        category.ImageUrl = request.ImageUrl;
        category.SortOrder = request.SortOrder;
        category.IsActive = request.IsActive;
        category.UpdatedDate = DateTime.UtcNow;

        await _categoryRepository.UpdateAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<CategoryDto>(true, new CategoryDto(
            category.Id, category.Name, category.Description, category.ImageUrl, category.SortOrder, category.IsActive));
    }
}
