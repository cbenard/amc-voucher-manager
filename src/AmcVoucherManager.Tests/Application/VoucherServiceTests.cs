using AmcVoucherManager.Application.DTOs;
using AmcVoucherManager.Application.Services;
using AmcVoucherManager.Domain.Entities;
using AmcVoucherManager.Domain.Enums;
using AmcVoucherManager.Domain.Interfaces;
using FluentAssertions;
using Moq;

namespace AmcVoucherManager.Tests.Application;

public class VoucherServiceTests
{
    private readonly Mock<IVoucherRepository> _repositoryMock;
    private readonly VoucherService _sut;

    public VoucherServiceTests()
    {
        _repositoryMock = new Mock<IVoucherRepository>();
        _sut = new VoucherService(_repositoryMock.Object);
    }

    [Fact]
    public async Task CreateAsync_WithDefaultDate_UsesToday()
    {
        var request = new CreateVoucherRequest(
            VoucherType.Ticket,
            "123456789012",
            "1234567890123456",
            null,
            null
        );

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Voucher>()))
            .ReturnsAsync((Voucher v) => v);

        var result = await _sut.CreateAsync(request);

        result.Type.Should().Be(VoucherType.Ticket);
        result.Number12.Should().Be("123456789012");
        result.Number16.Should().Be("1234567890123456");
        result.Notes.Should().BeNull();
        result.IsArchived.Should().BeFalse();
        result.DateAdded.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
        result.ArchivedDate.Should().BeNull();
    }

    [Fact]
    public async Task CreateAsync_WithProvidedDate_UsesProvidedDate()
    {
        var customDate = new DateOnly(2025, 12, 25);
        var request = new CreateVoucherRequest(
            VoucherType.Drink,
            "111111111111",
            "1111111111111111",
            "Christmas voucher",
            customDate
        );

        _repositoryMock
            .Setup(r => r.CreateAsync(It.IsAny<Voucher>()))
            .ReturnsAsync((Voucher v) => v);

        var result = await _sut.CreateAsync(request);

        result.DateAdded.Should().Be(customDate);
        result.Notes.Should().Be("Christmas voucher");
    }

    [Fact]
    public async Task GetAllAsync_WithoutType_ReturnsAllVouchers()
    {
        var vouchers = new List<Voucher>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Type = VoucherType.Ticket,
                Number12 = "1", Number16 = "1",
                DateAdded = new DateOnly(2026, 1, 1),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
            new()
            {
                Id = Guid.NewGuid(),
                Type = VoucherType.Drink,
                Number12 = "2", Number16 = "2",
                DateAdded = new DateOnly(2026, 2, 1),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync(null, false))
            .ReturnsAsync(vouchers);

        var result = await _sut.GetAllAsync();

        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetAllAsync_WithType_ReturnsFilteredVouchers()
    {
        var vouchers = new List<Voucher>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Type = VoucherType.Ticket,
                Number12 = "1", Number16 = "1",
                DateAdded = new DateOnly(2026, 1, 1),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync(VoucherType.Ticket, false))
            .ReturnsAsync(vouchers);

        var result = await _sut.GetAllAsync("Ticket");

        result.Should().ContainSingle()
            .Which.Type.Should().Be(VoucherType.Ticket);
    }

    [Fact]
    public async Task GetAllAsync_WithIncludeArchived_ReturnsArchived()
    {
        var vouchers = new List<Voucher>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Type = VoucherType.Popcorn,
                Number12 = "3", Number16 = "3",
                IsArchived = true,
                ArchivedDate = new DateOnly(2026, 5, 1),
                DateAdded = new DateOnly(2026, 1, 1),
                CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
            },
        };

        _repositoryMock
            .Setup(r => r.GetAllAsync(VoucherType.Popcorn, true))
            .ReturnsAsync(vouchers);

        var result = await _sut.GetAllAsync("Popcorn", includeArchived: true);

        result.Should().ContainSingle()
            .Which.IsArchived.Should().BeTrue();
    }

    [Fact]
    public async Task GetByIdAsync_WhenExists_ReturnsVoucher()
    {
        var id = Guid.NewGuid();
        var voucher = new Voucher
        {
            Id = id,
            Type = VoucherType.Ticket,
            Number12 = "123456789012", Number16 = "1234567890123456",
            DateAdded = new DateOnly(2026, 1, 1),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(voucher);

        var result = await _sut.GetByIdAsync(id);

        result.Should().NotBeNull();
        result!.Id.Should().Be(id);
    }

    [Fact]
    public async Task GetByIdAsync_WhenMissing_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Voucher?)null);

        var result = await _sut.GetByIdAsync(id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task ToggleArchiveAsync_WhenArchiving_SetsArchivedDate()
    {
        var id = Guid.NewGuid();
        var voucher = new Voucher
        {
            Id = id,
            Type = VoucherType.Ticket,
            Number12 = "1", Number16 = "1",
            IsArchived = false,
            DateAdded = new DateOnly(2026, 1, 1),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(voucher);
        _repositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Voucher>()))
            .ReturnsAsync((Voucher v) => v);

        var result = await _sut.ToggleArchiveAsync(id);

        result.Should().NotBeNull();
        result!.IsArchived.Should().BeTrue();
        result.ArchivedDate.Should().Be(DateOnly.FromDateTime(DateTime.UtcNow));
    }

    [Fact]
    public async Task ToggleArchiveAsync_WhenUnarchiving_ClearsArchivedDate()
    {
        var id = Guid.NewGuid();
        var voucher = new Voucher
        {
            Id = id,
            Type = VoucherType.Ticket,
            Number12 = "1", Number16 = "1",
            IsArchived = true,
            ArchivedDate = new DateOnly(2026, 5, 1),
            DateAdded = new DateOnly(2026, 1, 1),
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(voucher);
        _repositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Voucher>()))
            .ReturnsAsync((Voucher v) => v);

        var result = await _sut.ToggleArchiveAsync(id);

        result.Should().NotBeNull();
        result!.IsArchived.Should().BeFalse();
        result.ArchivedDate.Should().BeNull();
    }

    [Fact]
    public async Task ToggleArchiveAsync_WhenMissing_ReturnsNull()
    {
        var id = Guid.NewGuid();
        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Voucher?)null);

        var result = await _sut.ToggleArchiveAsync(id);

        result.Should().BeNull();
    }

    [Fact]
    public async Task UpdateAsync_UpdatesFields()
    {
        var id = Guid.NewGuid();
        var voucher = new Voucher
        {
            Id = id,
            Type = VoucherType.Ticket,
            Number12 = "old", Number16 = "old",
            Notes = "old note",
            DateAdded = new DateOnly(2026, 1, 1),
            CreatedAt = DateTime.UtcNow.AddDays(-1),
            UpdatedAt = DateTime.UtcNow.AddDays(-1),
        };

        var request = new UpdateVoucherRequest(
            VoucherType.Drink,
            "new12", "new16",
            "new note",
            new DateOnly(2026, 6, 1),
            null
        );

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(voucher);
        _repositoryMock
            .Setup(r => r.UpdateAsync(It.IsAny<Voucher>()))
            .ReturnsAsync((Voucher v) => v);

        var result = await _sut.UpdateAsync(id, request);

        result.Type.Should().Be(VoucherType.Drink);
        result.Number12.Should().Be("new12");
        result.Number16.Should().Be("new16");
        result.Notes.Should().Be("new note");
        result.DateAdded.Should().Be(new DateOnly(2026, 6, 1));
    }

    [Fact]
    public async Task UpdateAsync_WhenMissing_ThrowsKeyNotFoundException()
    {
        var id = Guid.NewGuid();
        var request = new UpdateVoucherRequest(null, null, null, null, null, null);

        _repositoryMock.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((Voucher?)null);

        await FluentActions
            .Awaiting(() => _sut.UpdateAsync(id, request))
            .Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task DeleteAsync_DelegatesToRepository()
    {
        var id = Guid.NewGuid();

        await _sut.DeleteAsync(id);

        _repositoryMock.Verify(r => r.DeleteAsync(id), Times.Once);
    }
}
