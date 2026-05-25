using AmcVoucherManager.Application.DTOs;
using AmcVoucherManager.Domain.Interfaces;
using AmcVoucherManager.WebApi.Hubs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace AmcVoucherManager.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[AutoValidateAntiforgeryToken]
public class VouchersController : ControllerBase
{
    private readonly IVoucherService _voucherService;
    private readonly IHubContext<VoucherHub> _hubContext;

    public VouchersController(IVoucherService voucherService, IHubContext<VoucherHub> hubContext)
    {
        _voucherService = voucherService;
        _hubContext = hubContext;
    }

    [HttpGet]
    [IgnoreAntiforgeryToken]
    public async Task<ActionResult<IEnumerable<VoucherDto>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] bool includeArchived = false)
    {
        var vouchers = await _voucherService.GetAllAsync(type, includeArchived);
        return Ok(vouchers);
    }

    [HttpGet("{id:guid}")]
    [IgnoreAntiforgeryToken]
    public async Task<ActionResult<VoucherDto>> GetById(Guid id)
    {
        var voucher = await _voucherService.GetByIdAsync(id);
        if (voucher is null) return NotFound();
        return Ok(voucher);
    }

    [HttpPost]
    public async Task<ActionResult<VoucherDto>> Create([FromBody] CreateVoucherRequest request)
    {
        var voucher = await _voucherService.CreateAsync(request);
        await _hubContext.Clients.All.SendAsync("VoucherCreated", voucher);
        return CreatedAtAction(nameof(GetById), new { id = voucher.Id }, voucher);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<VoucherDto>> Update(Guid id, [FromBody] UpdateVoucherRequest request)
    {
        try
        {
            var voucher = await _voucherService.UpdateAsync(id, request);
            await _hubContext.Clients.All.SendAsync("VoucherUpdated", voucher);
            return Ok(voucher);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<VoucherDto>> ToggleArchive(Guid id)
    {
        var voucher = await _voucherService.ToggleArchiveAsync(id);
        if (voucher is null) return NotFound();
        await _hubContext.Clients.All.SendAsync("VoucherArchived", voucher);
        return Ok(voucher);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _voucherService.DeleteAsync(id);
        await _hubContext.Clients.All.SendAsync("VoucherDeleted", id);
        return NoContent();
    }
}
