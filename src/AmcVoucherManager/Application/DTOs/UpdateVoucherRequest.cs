using System.ComponentModel.DataAnnotations;
using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Application.DTOs;

public record UpdateVoucherRequest(
    VoucherType? Type,
    [StringLength(12)][RegularExpression(@"^\d{12}$")] string? Number12,
    [StringLength(16)][RegularExpression(@"^\d{16}$")] string? Number16,
    [StringLength(2000)] string? Notes,
    DateOnly? DateAdded,
    bool? IsArchived
);
