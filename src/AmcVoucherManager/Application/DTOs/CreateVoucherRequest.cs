using System.ComponentModel.DataAnnotations;
using AmcVoucherManager.Domain.Enums;

namespace AmcVoucherManager.Application.DTOs;

public record CreateVoucherRequest(
    [Required] VoucherType Type,
    [Required][StringLength(12, MinimumLength = 12)][RegularExpression(@"^\d{12}$")] string Number12,
    [Required][StringLength(16, MinimumLength = 16)][RegularExpression(@"^\d{16}$")] string Number16,
    [StringLength(2000)] string? Notes,
    DateOnly? DateAdded
);
