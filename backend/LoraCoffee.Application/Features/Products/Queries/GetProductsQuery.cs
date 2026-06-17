using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using MediatR;

namespace LoraCoffee.Application.Features.Products.Queries;

public record GetProductsQuery(Guid? CategoryId, bool IncludeInactive = false) : IRequest<ApiResponse<List<ProductDto>>>;

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
            ? await GetByCategoryAsync(request, cancellationToken)
            : await GetAllProductsAsync(request, cancellationToken);

        var recipeMap = await _recipeRepository.GetHasActiveRecipeMapAsync(cancellationToken);

        var dtos = products.Select(p => new ProductDto(
            p.Id, p.Name, p.Description, p.Price, p.PriceLarge, p.SupportsMilkChoice, p.ImageUrl,
            p.IsActive, p.TrackStock, p.StockQuantity, recipeMap.ContainsKey(p.Id), p.CategoryId, p.Category?.Name ?? "")).ToList();

        return new ApiResponse<List<ProductDto>>(true, dtos);
    }

    private async Task<IReadOnlyList<Product>> GetAllProductsAsync(
        GetProductsQuery request, CancellationToken cancellationToken)
    {
        if (!request.IncludeInactive)
            return await _productRepository.GetActiveProductsAsync(cancellationToken);

        var all = await _productRepository.GetAllWithCategoryAsync(cancellationToken);
        return all.OrderBy(p => p.Name).ToList();
    }

    private async Task<IReadOnlyList<Product>> GetByCategoryAsync(
        GetProductsQuery request, CancellationToken cancellationToken)
    {
        if (!request.IncludeInactive)
            return await _productRepository.GetByCategoryAsync(request.CategoryId!.Value, cancellationToken);

        var all = await _productRepository.GetAllWithCategoryAsync(cancellationToken);
        return all
            .Where(p => p.CategoryId == request.CategoryId!.Value)
            .OrderBy(p => p.Name)
            .ToList();
    }
}
