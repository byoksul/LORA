namespace LoraCoffee.Application.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, UserDto User);
public record UserDto(Guid Id, string Email, string FirstName, string LastName, string Role, bool IsActive, DateTime? LastLoginDate);

public record CategoryDto(Guid Id, string Name, string? Description, string? ImageUrl, int SortOrder, bool IsActive);
public record ProductDto(Guid Id, string Name, string? Description, decimal Price, string? ImageUrl, bool IsActive, bool TrackStock, Guid CategoryId, string CategoryName);
public record CreateProductRequest(string Name, string? Description, decimal Price, string? ImageUrl, bool IsActive, bool TrackStock, Guid CategoryId);
public record UpdateProductRequest(string Name, string? Description, decimal Price, string? ImageUrl, bool IsActive, bool TrackStock, Guid CategoryId);

public record OrderItemDto(Guid Id, Guid ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal TotalPrice);
public record PaymentDto(Guid Id, string PaymentType, decimal Amount);
public record OrderDto(Guid Id, int OrderNumber, string Status, decimal TotalAmount, string? Notes, DateTime CreatedDate, DateTime? ReadyAt, List<OrderItemDto> Items, List<PaymentDto> Payments);
public record CreateOrderRequest(List<CreateOrderItemRequest> Items, string? Notes, List<CreatePaymentRequest> Payments);
public record CreateOrderItemRequest(Guid ProductId, int Quantity);
public record CreatePaymentRequest(string PaymentType, decimal Amount);
public record UpdateOrderStatusRequest(string Status);

public record StockItemDto(Guid Id, string Name, string Unit, decimal CurrentQuantity, decimal CriticalLevel, bool IsActive, bool IsCritical);
public record StockMovementDto(Guid Id, Guid StockItemId, string MovementType, decimal Quantity, string? Notes, DateTime CreatedDate);
public record CreateStockMovementRequest(Guid StockItemId, string MovementType, decimal Quantity, string? Notes);

public record DashboardDto(decimal DailyRevenue, decimal WeeklyRevenue, decimal MonthlyRevenue, int OrderCount, decimal AverageBasket, List<TopProductDto> TopProducts, List<TopProductDto> LowProducts, List<HourlyDataDto> HourlyTraffic, PaymentDistributionDto PaymentDistribution);
public record TopProductDto(string ProductName, int Quantity, decimal Revenue);
public record HourlyDataDto(int Hour, int OrderCount);
public record PaymentDistributionDto(decimal CardAmount, decimal CashAmount, decimal ComplimentaryAmount);

public record SalesReportDto(DateTime Date, int OrderCount, decimal TotalRevenue, decimal AverageBasket);
public record ProductSalesReportDto(string ProductName, int Quantity, decimal Revenue);
public record StaffSalesReportDto(string StaffName, int OrderCount, decimal TotalRevenue);

public record CreateUserRequest(string Email, string Password, string FirstName, string LastName, string Role);
public record UpdateUserRequest(string FirstName, string LastName, string Role, bool IsActive);

public record ApiResponse<T>(bool Success, T? Data, string? Message = null);
