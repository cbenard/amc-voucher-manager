using AmcVoucherManager.Domain.Entities;
using AmcVoucherManager.Domain.Enums;
using FluentAssertions;

namespace AmcVoucherManager.Tests.Domain;

public class VoucherTests
{
    [Fact]
    public void Voucher_WithDefaults_HasExpectedProperties()
    {
        var voucher = new Voucher
        {
            Id = Guid.NewGuid(),
            Type = VoucherType.Ticket,
            Number12 = "123456789012",
            Number16 = "1234567890123456",
            DateAdded = new DateOnly(2026, 5, 1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        voucher.Type.Should().Be(VoucherType.Ticket);
        voucher.Number12.Should().Be("123456789012");
        voucher.Number16.Should().Be("1234567890123456");
        voucher.IsArchived.Should().BeFalse();
        voucher.ArchivedDate.Should().BeNull();
        voucher.Notes.Should().BeNull();
    }

    [Fact]
    public void Voucher_WhenArchived_SetsArchivedDate()
    {
        var voucher = new Voucher
        {
            Id = Guid.NewGuid(),
            Type = VoucherType.Drink,
            Number12 = "000000000000",
            Number16 = "0000000000000000",
            DateAdded = new DateOnly(2026, 1, 1),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        voucher.IsArchived = true;
        voucher.ArchivedDate = new DateOnly(2026, 5, 24);

        voucher.IsArchived.Should().BeTrue();
        voucher.ArchivedDate.Should().Be(new DateOnly(2026, 5, 24));
    }

    [Fact]
    public void Voucher_WithNotes_StoresNotes()
    {
        var voucher = new Voucher
        {
            Id = Guid.NewGuid(),
            Type = VoucherType.Popcorn,
            Number12 = "987654321098",
            Number16 = "9876543210987654",
            Notes = "Test notes for the voucher",
            DateAdded = new DateOnly(2026, 5, 24),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        voucher.Notes.Should().Be("Test notes for the voucher");
    }

    [Fact]
    public void VoucherType_Enum_HasExpectedValues()
    {
        ((int)VoucherType.Ticket).Should().Be(0);
        ((int)VoucherType.Drink).Should().Be(1);
        ((int)VoucherType.Popcorn).Should().Be(2);
    }
}
