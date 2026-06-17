namespace LoraCoffee.Domain.Enums;

public enum StockMovementType
{
    PurchaseIn = 0,
    ManualIn = 1,
    ManualOut = 2,
    SaleOut = 3,
    WasteOut = 4,
    Adjustment = 5,
    ReturnIn = 6,
    CancelReturn = 7
}
