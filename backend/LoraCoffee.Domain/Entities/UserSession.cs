using LoraCoffee.Domain.Common;

namespace LoraCoffee.Domain.Entities;

public class UserSession : BaseEntity
{
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
}
