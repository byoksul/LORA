using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Interfaces;
using LoraCoffee.Domain.Entities;
using MediatR;

namespace LoraCoffee.Application.Features.Recipes.Commands;

public record UpsertProductRecipeCommand(Guid ProductId, UpsertProductRecipeRequest Request) : IRequest<ApiResponse<ProductRecipeDto>>;
public record DeleteProductRecipeItemCommand(Guid ProductId, Guid ItemId) : IRequest<ApiResponse<ProductRecipeDto>>;

public class UpsertProductRecipeCommandHandler : IRequestHandler<UpsertProductRecipeCommand, ApiResponse<ProductRecipeDto>>
{
    private readonly IProductRepository _productRepository;
    private readonly IProductRecipeRepository _recipeRepository;
    private readonly IRepository<ProductRecipeItem> _recipeItemRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpsertProductRecipeCommandHandler(
        IProductRepository productRepository,
        IProductRecipeRepository recipeRepository,
        IRepository<ProductRecipeItem> recipeItemRepository,
        IUnitOfWork unitOfWork)
    {
        _productRepository = productRepository;
        _recipeRepository = recipeRepository;
        _recipeItemRepository = recipeItemRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<ProductRecipeDto>> Handle(UpsertProductRecipeCommand command, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(command.ProductId, cancellationToken);
        if (product is null)
            return new ApiResponse<ProductRecipeDto>(false, null, "Ürün bulunamadı.");

        var recipe = await _recipeRepository.GetByProductIdWithItemsAsync(command.ProductId, cancellationToken);
        var request = command.Request;

        if (recipe is null)
        {
            recipe = new ProductRecipe
            {
                ProductId = command.ProductId,
                Name = request.Name,
                IsActive = request.IsActive
            };
            await _recipeRepository.AddAsync(recipe, cancellationToken);
        }
        else
        {
            recipe.Name = request.Name;
            recipe.IsActive = request.IsActive;
            recipe.UpdatedDate = DateTime.UtcNow;

            foreach (var existing in recipe.Items.ToList())
                await _recipeItemRepository.DeleteAsync(existing, cancellationToken);
        }

        foreach (var item in request.Items)
        {
            recipe.Items.Add(new ProductRecipeItem
            {
                StockItemId = item.StockItemId,
                Quantity = item.Quantity,
                Unit = item.Unit,
                IsOptional = item.IsOptional
            });
        }

        product.TrackStock = true;
        product.UpdatedDate = DateTime.UtcNow;

        await _productRepository.UpdateAsync(product, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshed = await _recipeRepository.GetByProductIdWithItemsAsync(command.ProductId, cancellationToken);
        return new ApiResponse<ProductRecipeDto>(true, RecipeMapper.ToDto(refreshed!));
    }
}

public class DeleteProductRecipeItemCommandHandler : IRequestHandler<DeleteProductRecipeItemCommand, ApiResponse<ProductRecipeDto>>
{
    private readonly IProductRecipeRepository _recipeRepository;
    private readonly IRepository<ProductRecipeItem> _recipeItemRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProductRecipeItemCommandHandler(
        IProductRecipeRepository recipeRepository,
        IRepository<ProductRecipeItem> recipeItemRepository,
        IUnitOfWork unitOfWork)
    {
        _recipeRepository = recipeRepository;
        _recipeItemRepository = recipeItemRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<ApiResponse<ProductRecipeDto>> Handle(DeleteProductRecipeItemCommand command, CancellationToken cancellationToken)
    {
        var recipe = await _recipeRepository.GetByProductIdWithItemsAsync(command.ProductId, cancellationToken);
        if (recipe is null)
            return new ApiResponse<ProductRecipeDto>(false, null, "Reçete bulunamadı.");

        var item = recipe.Items.FirstOrDefault(i => i.Id == command.ItemId);
        if (item is null)
            return new ApiResponse<ProductRecipeDto>(false, null, "Reçete kalemi bulunamadı.");

        await _recipeItemRepository.DeleteAsync(item, cancellationToken);
        recipe.UpdatedDate = DateTime.UtcNow;
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var refreshed = await _recipeRepository.GetByProductIdWithItemsAsync(command.ProductId, cancellationToken);
        return new ApiResponse<ProductRecipeDto>(true, RecipeMapper.ToDto(refreshed!));
    }
}

public static class RecipeMapper
{
    public static ProductRecipeDto ToDto(ProductRecipe recipe) => new(
        recipe.Id, recipe.ProductId, recipe.Name, recipe.IsActive,
        recipe.Items.Select(i => new ProductRecipeItemDto(
            i.Id, i.StockItemId, i.StockItem?.Name ?? "", i.Quantity, i.Unit, i.IsOptional)).ToList(),
        recipe.CreatedDate, recipe.UpdatedDate);
}
