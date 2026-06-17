using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Categories.Queries;

public record GetCategoriesQuery(bool IncludeInactive = false) : IRequest<ApiResponse<List<CategoryDto>>>;

public class GetCategoriesQueryHandler : IRequestHandler<GetCategoriesQuery, ApiResponse<List<CategoryDto>>>
{
    private readonly ICategoryRepository _categoryRepository;

    public GetCategoriesQueryHandler(ICategoryRepository categoryRepository)
    {
        _categoryRepository = categoryRepository;
    }

    public async Task<ApiResponse<List<CategoryDto>>> Handle(GetCategoriesQuery request, CancellationToken cancellationToken)
    {
        var categories = request.IncludeInactive
            ? await _categoryRepository.GetAllOrderedAsync(cancellationToken)
            : await _categoryRepository.GetActiveCategoriesAsync(cancellationToken);
        var dtos = categories.Select(c => new CategoryDto(
            c.Id, c.Name, c.Description, c.ImageUrl, c.SortOrder, c.IsActive)).ToList();
        return new ApiResponse<List<CategoryDto>>(true, dtos);
    }
}
