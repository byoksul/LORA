using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using MediatR;

namespace LoraCoffee.Application.Features.Products.Commands;

public record CreateProductCommand(CreateProductRequest Request) : IRequest<ApiResponse<ProductDto>>;
public record UpdateProductCommand(Guid Id, UpdateProductRequest Request) : IRequest<ApiResponse<ProductDto>>;
public record DeleteProductCommand(Guid Id) : IRequest<ApiResponse<bool>>;

public class CreateProductCommandHandler : IRequestHandler<CreateProductCommand, ApiResponse<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateProductCommandHandler(IProductRepository productRepository, IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<ProductDto>> Handle(CreateProductCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var product = new Product
        {
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            ImageUrl = request.ImageUrl,
            IsActive = request.IsActive,
            TrackStock = request.TrackStock,
            StockQuantity = request.TrackStock ? request.StockQuantity : 0,
            CategoryId = request.CategoryId
        };

        await _productRepository.AddAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<ProductDto>(true, new ProductDto(
            product.Id, product.Name, product.Description, product.Price, product.PriceLarge, product.SupportsMilkChoice, product.ImageUrl,
            product.IsActive, product.TrackStock, product.StockQuantity, false, product.CategoryId, ""));
    }
}

public class UpdateProductCommandHandler : IRequestHandler<UpdateProductCommand, ApiResponse<ProductDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateProductCommandHandler(IProductRepository productRepository, IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<ProductDto>> Handle(UpdateProductCommand command, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(command.Id, cancellationToken);
        if (product is null)
            return new ApiResponse<ProductDto>(false, null, "Ürün bulunamadı.");

        var request = command.Request;
        product.Name = request.Name;
        product.Description = request.Description;
        product.Price = request.Price;
        product.ImageUrl = request.ImageUrl;
        product.IsActive = request.IsActive;
        product.TrackStock = request.TrackStock;
        product.StockQuantity = request.TrackStock ? request.StockQuantity : 0;
        product.CategoryId = request.CategoryId;
        product.UpdatedDate = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<ProductDto>(true, new ProductDto(
            product.Id, product.Name, product.Description, product.Price, product.PriceLarge, product.SupportsMilkChoice, product.ImageUrl,
            product.IsActive, product.TrackStock, product.StockQuantity, false, product.CategoryId, ""));
    }
}

public class DeleteProductCommandHandler : IRequestHandler<DeleteProductCommand, ApiResponse<bool>>
{
    private readonly IProductRepository _productRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProductCommandHandler(IProductRepository productRepository, IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<bool>> Handle(DeleteProductCommand command, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(command.Id, cancellationToken);
        if (product is null)
            return new ApiResponse<bool>(false, false, "Ürün bulunamadı.");

        if (await _productRepository.HasOrderHistoryAsync(command.Id, cancellationToken))
            return new ApiResponse<bool>(false, false, "Sipariş geçmişi olan ürün silinemez. Pasife alabilirsiniz.");

        await _productRepository.DeleteWithRecipesAsync(command.Id, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return new ApiResponse<bool>(true, true);
    }
}
