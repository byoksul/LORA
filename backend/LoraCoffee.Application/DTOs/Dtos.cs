namespace LoraCoffee.Application.DTOs;

public record LoginRequest(string Username, string Password);
public record LoginResponse(string Token, UserDto User);
public record UserDto(Guid Id, string Email, string FirstName, string LastName, string Role, bool IsActive, DateTime? LastLoginDate);

public record CategoryDto(Guid Id, string Name, string? Description, string? ImageUrl, int SortOrder, bool IsActive);
public record ProductDto(Guid Id, string Name, string? Description, decimal Price, decimal? PriceLarge, bool SupportsMilkChoice, string? ImageUrl, bool IsActive, bool TrackStock, bool HasActiveRecipe, Guid CategoryId, string CategoryName);
public record CreateProductRequest(string Name, string? Description, decimal Price, string? ImageUrl, bool IsActive, bool TrackStock, Guid CategoryId);
public record UpdateProductRequest(string Name, string? Description, decimal Price, string? ImageUrl, bool IsActive, bool TrackStock, Guid CategoryId);

public record OrderItemDto(Guid Id, Guid ProductId, string ProductName, string? SizeLabel, string? MilkType, int Quantity, decimal UnitPrice, decimal TotalPrice);
public record PaymentDto(Guid Id, string PaymentType, decimal Amount);
public record OrderDto(Guid Id, int OrderNumber, string Status, decimal SubtotalAmount, decimal DiscountAmount, string DiscountType, decimal TotalAmount, string? Notes, DateTime CreatedDate, DateTime? ReadyAt, List<OrderItemDto> Items, List<PaymentDto> Payments);
public record CreateOrderRequest(List<CreateOrderItemRequest> Items, string? Notes, List<CreatePaymentRequest> Payments, string? DiscountType = null);
public record CreateOrderItemRequest(Guid ProductId, int Quantity, string? SizeLabel = null, string? MilkType = null);
public record CreatePaymentRequest(string PaymentType, decimal Amount);
public record UpdateOrderStatusRequest(string Status);

public record StockItemDto(Guid Id, string Name, string Unit, decimal CurrentQuantity, decimal CriticalLevel, bool IsActive, bool IsCritical);
public record StockMovementDto(
    Guid Id, Guid StockItemId, string StockItemName, string Unit, string MovementType,
    decimal Quantity, decimal PreviousQuantity, decimal NewQuantity,
    string? ReferenceType, Guid? ReferenceId, string? Notes, string? CreatedByName, DateTime CreatedDate);
public record CreateStockMovementRequest(Guid StockItemId, string MovementType, decimal Quantity, string? Notes);
public record CreateStockItemRequest(string Name, string Unit, decimal CurrentQuantity, decimal CriticalLevel, bool IsActive);
public record UpdateStockItemRequest(string Name, string Unit, decimal CriticalLevel, bool IsActive);

public record PurchaseEntryRequest(
    decimal Quantity, decimal? UnitCost, decimal? TotalCost,
    string? SupplierName, string? InvoiceNumber, string? Notes);

public record WasteEntryRequest(decimal Quantity, string Reason, string? Notes);
public record AdjustmentRequest(decimal CountedQuantity, string? Notes);
public record ManualMovementRequest(decimal Quantity, string? Notes);

public record ProductRecipeDto(
    Guid Id, Guid ProductId, string Name, bool IsActive,
    List<ProductRecipeItemDto> Items, DateTime CreatedDate, DateTime UpdatedDate);
public record ProductRecipeItemDto(
    Guid Id, Guid StockItemId, string StockItemName, decimal Quantity, string Unit, bool IsOptional);
public record UpsertProductRecipeRequest(string Name, bool IsActive, List<UpsertProductRecipeItemRequest> Items);
public record UpsertProductRecipeItemRequest(Guid StockItemId, decimal Quantity, string Unit, bool IsOptional);
public record AddProductRecipeItemRequest(Guid StockItemId, decimal Quantity, string Unit, bool IsOptional);

public record StockAlertDto(Guid StockItemId, string Name, string Unit, decimal CurrentQuantity, decimal CriticalLevel, bool IsCritical);
public record StockForecastDto(
    Guid StockItemId, string Name, string Unit, decimal CurrentQuantity,
    decimal? DailyAverageUsage, decimal? RemainingDays, bool HasEnoughData, string Message);
public record StockDashboardDto(
    int CriticalStockCount, int TodaySaleOutCount, decimal TodayWasteQuantity,
    List<StockConsumptionDto> TopConsumedItems, List<StockForecastDto> ExpiringSoon);
public record StockConsumptionDto(Guid StockItemId, string Name, string Unit, decimal TotalQuantity);

public record DashboardDto(
    decimal DailyRevenue, decimal WeeklyRevenue, decimal MonthlyRevenue, int OrderCount, decimal AverageBasket,
    List<TopProductDto> TopProducts, List<TopProductDto> LowProducts, List<HourlyDataDto> HourlyTraffic,
    PaymentDistributionDto PaymentDistribution, StockDashboardDto? StockSummary);
public record TopProductDto(string ProductName, int Quantity, decimal Revenue);
public record HourlyDataDto(int Hour, int OrderCount);
public record PaymentDistributionDto(decimal CardAmount, decimal CashAmount, decimal ComplimentaryAmount);

public record SalesReportDto(DateTime Date, int OrderCount, decimal TotalRevenue, decimal AverageBasket);
public record ProductSalesReportDto(string ProductName, int Quantity, decimal Revenue);
public record StaffSalesReportDto(string StaffName, int OrderCount, decimal TotalRevenue);

public record CreateUserRequest(string Email, string Password, string FirstName, string LastName, string Role);
public record UpdateUserRequest(string FirstName, string LastName, string Role, bool IsActive);

public record ApiResponse<T>(bool Success, T? Data, string? Message = null);
