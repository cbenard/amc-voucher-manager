using AmcVoucherManager.Application.DTOs;
using AmcVoucherManager.Domain.Enums;
using AmcVoucherManager.Domain.Interfaces;
using AmcVoucherManager.WebApi.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;

namespace AmcVoucherManager.Tests.WebApi;

public class VouchersControllerTests
{
    private readonly Mock<IVoucherService> _serviceMock;
    private readonly VouchersController _sut;

    public VouchersControllerTests()
    {
        _serviceMock = new Mock<IVoucherService>();
        _sut = new VouchersController(_serviceMock.Object);
    }

    private static VoucherDto SampleVoucher(Guid? id = null) => new(
        id ?? Guid.NewGuid(),
        VoucherType.Ticket,
        "123456789012",
        "1234567890123456",
        null,
        new DateOnly(2026, 5, 1),
        false,
        null,
        DateTime.UtcNow,
        DateTime.UtcNow
    );

    [Fact]
    public async Task GetAll_ReturnsOkWithVouchers()
    {
        var vouchers = new[] { SampleVoucher() };
        _serviceMock.Setup(s => s.GetAllAsync(null, false)).ReturnsAsync(vouchers);

        var result = await _sut.GetAll(null, false);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().BeAssignableTo<IEnumerable<VoucherDto>>();
    }

    [Fact]
    public async Task GetAll_WithType_FiltersByType()
    {
        var vouchers = new[] { SampleVoucher() };
        _serviceMock.Setup(s => s.GetAllAsync("ticket", false)).ReturnsAsync(vouchers);

        var result = await _sut.GetAll("ticket", false);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var voucher = SampleVoucher(id);
        _serviceMock.Setup(s => s.GetByIdAsync(id)).ReturnsAsync(voucher);

        var result = await _sut.GetById(id);

        result.Result.Should().BeOfType<OkObjectResult>();
        var okResult = result.Result as OkObjectResult;
        okResult!.Value.Should().Be(voucher);
    }

    [Fact]
    public async Task GetById_WhenMissing_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.GetByIdAsync(id)).ReturnsAsync((VoucherDto?)null);

        var result = await _sut.GetById(id);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var request = new CreateVoucherRequest(
            VoucherType.Ticket,
            "123456789012",
            "1234567890123456",
            null,
            null
        );
        var created = SampleVoucher();
        _serviceMock.Setup(s => s.CreateAsync(request)).ReturnsAsync(created);

        var result = await _sut.Create(request);

        var createdResult = result.Result.Should().BeOfType<CreatedAtActionResult>().Subject;
        createdResult.ActionName.Should().Be(nameof(VouchersController.GetById));
        createdResult.RouteValues!["id"].Should().Be(created.Id);
        createdResult.Value.Should().Be(created);
    }

    [Fact]
    public async Task Update_WhenExists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var request = new UpdateVoucherRequest(null, null, null, null, null, null);
        var updated = SampleVoucher(id);
        _serviceMock.Setup(s => s.UpdateAsync(id, request)).ReturnsAsync(updated);

        var result = await _sut.Update(id, request);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task Update_WhenMissing_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        var request = new UpdateVoucherRequest(null, null, null, null, null, null);
        _serviceMock.Setup(s => s.UpdateAsync(id, request)).ThrowsAsync(new KeyNotFoundException());

        var result = await _sut.Update(id, request);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task ToggleArchive_WhenExists_ReturnsOk()
    {
        var id = Guid.NewGuid();
        var archived = SampleVoucher(id) with { IsArchived = true, ArchivedDate = new DateOnly(2026, 5, 24) };
        _serviceMock.Setup(s => s.ToggleArchiveAsync(id)).ReturnsAsync(archived);

        var result = await _sut.ToggleArchive(id);

        result.Result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task ToggleArchive_WhenMissing_ReturnsNotFound()
    {
        var id = Guid.NewGuid();
        _serviceMock.Setup(s => s.ToggleArchiveAsync(id)).ReturnsAsync((VoucherDto?)null);

        var result = await _sut.ToggleArchive(id);

        result.Result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        var id = Guid.NewGuid();

        var result = await _sut.Delete(id);

        result.Should().BeOfType<NoContentResult>();
        _serviceMock.Verify(s => s.DeleteAsync(id), Times.Once);
    }
}
