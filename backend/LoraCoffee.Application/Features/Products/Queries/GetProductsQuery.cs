using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Products.Queries;

public record GetProductsQuery(Guid? CategoryId) : IRequest<ApiResponse<List<ProductDto>>>;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, ApiResponse<List<ProductDto>>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductRecipeRepository _recipeRepository;

    public GetProductsQueryHandler(IProductRepository productRepository, IProductRecipeRepository recipeRepository)
    {
        _productRepository = productRepository;
        _recipeRepository = recipeRepository;
    }

    public async Task<ApiResponse<List<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = request.CategoryId.HasValue
            ? await _productRepository.GetByCategoryAsync(request.CategoryId.Value, cancellationToken)
            : await _productRepository.GetActiveProductsAsync(cancellationToken);

        var recipeMap = await _recipeRepository.GetHasActiveRecipeMapAsync(cancellationToken);

        var dtos = products.Select(p => new ProductDto(
            p.Id, p.Name, p.Description, p.Price, p.PriceLarge, p.SupportsMilkChoice, p.ImageUrl,
            p.IsActive, p.TrackStock, recipeMap.ContainsKey(p.Id), p.CategoryId, p.Category?.Name ?? "")).ToList();

        return new ApiResponse<List<ProductDto>>(true, dtos);
    }
}
