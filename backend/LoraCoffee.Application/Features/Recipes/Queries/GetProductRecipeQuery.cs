using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Features.Recipes.Commands;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Recipes.Queries;

public record GetProductRecipeQuery(Guid ProductId) : IRequest<ApiResponse<ProductRecipeDto>>;

public class GetProductRecipeQueryHandler : IRequestHandler<GetProductRecipeQuery, ApiResponse<ProductRecipeDto>>
{
    private readonly IProductRecipeRepository _recipeRepository;

    public GetProductRecipeQueryHandler(IProductRecipeRepository recipeRepository)
    {
        _recipeRepository = recipeRepository;
    }

    public async Task<ApiResponse<ProductRecipeDto>> Handle(GetProductRecipeQuery request, CancellationToken cancellationToken)
    {
        var recipe = await _recipeRepository.GetByProductIdWithItemsAsync(request.ProductId, cancellationToken);
        if (recipe is null)
            return new ApiResponse<ProductRecipeDto>(false, null, "Reçete bulunamadı.");

        return new ApiResponse<ProductRecipeDto>(true, RecipeMapper.ToDto(recipe));
    }
}
