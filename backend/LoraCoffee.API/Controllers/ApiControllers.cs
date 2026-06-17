using System.Security.Claims;
using LoraCoffee.Application.DTOs;
using LoraCoffee.Application.Features.Auth.Commands;
using LoraCoffee.Application.Features.Categories.Commands;
using LoraCoffee.Application.Features.Categories.Queries;
using LoraCoffee.Application.Features.Dashboard.Queries;
using LoraCoffee.Application.Features.Orders.Commands;
using LoraCoffee.Application.Features.Orders.Queries;
using LoraCoffee.Application.Features.Products.Commands;
using LoraCoffee.Application.Features.Products.Queries;
using LoraCoffee.Application.Features.Reports.Queries;
using LoraCoffee.Application.Features.Stock.Commands;
using LoraCoffee.Application.Features.Stock.Queries;
using LoraCoffee.Application.Features.Users.Commands;
using LoraCoffee.Application.Features.Users.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LoraCoffee.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator) => _mediator = mediator;

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("login")]
    public async Task<ActionResult<ApiResponse<LoginResponse>>> Login([FromBody] LoginRequest request)
    {
        var result = await _mediator.Send(new LoginCommand(request.Username, request.Password));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator) => _mediator = mediator;

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<List<OrderDto> > >> GetActive()
        => Ok(await _mediator.Send(new GetActiveOrdersQuery()));

    [HttpPost]
  [Authorize(Roles = "SuperAdmin,Manager,Cashier")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> Create([FromBody] CreateOrderRequest request)
    {
        var userId = GetUserId();
        var result = await _mediator.Send(new CreateOrderCommand(request, userId));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "SuperAdmin,Manager,Barista")]
    public async Task<ActionResult<ApiResponse<OrderDto>>> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var result = await _mediator.Send(new UpdateOrderStatusCommand(id, request.Status, GetUserId()));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    private Guid? GetUserId()
    {
        var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return id is not null ? Guid.Parse(id) : null;
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProductsController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<ProductDto> > >> GetAll([FromQuery] Guid? categoryId)
        => Ok(await _mediator.Send(new GetProductsQuery(categoryId)));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Manager")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Create([FromBody] CreateProductRequest request)
    {
        var result = await _mediator.Send(new CreateProductCommand(request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Manager")]
    public async Task<ActionResult<ApiResponse<ProductDto>>> Update(Guid id, [FromBody] UpdateProductRequest request)
    {
        var result = await _mediator.Send(new UpdateProductCommand(id, request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly IMediator _mediator;

    public CategoriesController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<CategoryDto> > >> GetAll()
        => Ok(await _mediator.Send(new GetCategoriesQuery()));

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Manager")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Create([FromBody] CreateCategoryRequest request)
    {
        var result = await _mediator.Send(new CreateCategoryCommand(request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Manager")]
    public async Task<ActionResult<ApiResponse<CategoryDto>>> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var result = await _mediator.Send(new UpdateCategoryCommand(id, request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class DashboardController : ControllerBase
{
    private readonly IMediator _mediator;

    public DashboardController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<DashboardDto>>> Get()
        => Ok(await _mediator.Send(new GetDashboardQuery()));
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Manager")]
public class StockController : ControllerBase
{
    private readonly IMediator _mediator;

    public StockController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StockItemDto> > >> GetAll()
        => Ok(await _mediator.Send(new GetStockItemsQuery()));

    [HttpPost("movements")]
    public async Task<ActionResult<ApiResponse<StockMovementDto>>> CreateMovement([FromBody] CreateStockMovementRequest request)
    {
        var result = await _mediator.Send(new CreateStockMovementCommand(request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin")]
public class UsersController : ControllerBase
{
    private readonly IMediator _mediator;

    public UsersController(IMediator mediator) => _mediator = mediator;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserDto> > >> GetAll()
        => Ok(await _mediator.Send(new GetUsersQuery()));

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] CreateUserRequest request)
    {
        var result = await _mediator.Send(new CreateUserCommand(request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> Update(Guid id, [FromBody] UpdateUserRequest request)
    {
        var result = await _mediator.Send(new UpdateUserCommand(id, request));
        if (!result.Success) return BadRequest(result);
        return Ok(result);
    }
}

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SuperAdmin,Manager")]
public class ReportsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ReportsController(IMediator mediator) => _mediator = mediator;

    [HttpGet("sales")]
    public async Task<ActionResult<ApiResponse<List<SalesReportDto> > >> GetSales([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        => Ok(await _mediator.Send(new GetSalesReportQuery(startDate, endDate)));

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponse<List<ProductSalesReportDto> > >> GetProductSales([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        => Ok(await _mediator.Send(new GetProductSalesReportQuery(startDate, endDate)));

    [HttpGet("staff")]
    public async Task<ActionResult<ApiResponse<List<StaffSalesReportDto> > >> GetStaffSales([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        => Ok(await _mediator.Send(new GetStaffSalesReportQuery(startDate, endDate)));
}
