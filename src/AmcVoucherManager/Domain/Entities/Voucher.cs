using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Domain.Entities;

public class Voucher
{
    public Guid Id { get; set; }
    public VoucherType Type { get; set; }
    public string Number12 { get; set; } = string.Empty;
    public string Number16 { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateOnly DateAdded { get; set; }
    public bool IsArchived { get; set; }
    public DateOnly? ArchivedDate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
