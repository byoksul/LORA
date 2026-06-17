using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using MediatR;

namespace LoraCoffee.Application.Features.Products.Queries;

public record GetProductsQuery(Guid? CategoryId) : IRequest<ApiResponse<List<ProductDto>>>;

public class GetProductsQueryHandler : IRequestHandler<GetProductsQuery, ApiResponse<List<ProductDto>>>
{
    private readonly IProductRepository _productRepository;

    public GetProductsQueryHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<ApiResponse<List<ProductDto>>> Handle(GetProductsQuery request, CancellationToken cancellationToken)
    {
        var products = request.CategoryId.HasValue
            ? await _productRepository.GetByCategoryAsync(request.CategoryId.Value, cancellationToken)
            : await _productRepository.GetActiveProductsAsync(cancellationToken);

        var dtos = products.Select(p => new ProductDto(
            p.Id, p.Name, p.Description, p.Price, p.ImageUrl, p.IsActive, p.TrackStock, p.CategoryId, p.Category?.Name ?? "")).ToList();

        return new ApiResponse<List<ProductDto>>(true, dtos);
    }
}
