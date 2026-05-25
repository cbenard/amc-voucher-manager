using AmcVoucherManager.Application.DTOs;
using Microsoft.AspNetCore.SignalR;

namespace AmcVoucherManager.WebApi.Hubs;

public class VoucherHub : Hub
{
    public async Task NotifyCreated(VoucherDto voucher)
    {
        await Clients.Others.SendAsync("VoucherCreated", voucher);
    }

    public async Task NotifyUpdated(VoucherDto voucher)
    {
        await Clients.Others.SendAsync("VoucherUpdated", voucher);
    }

    public async Task NotifyArchived(VoucherDto voucher)
    {
        await Clients.Others.SendAsync("VoucherArchived", voucher);
    }

    public async Task NotifyDeleted(Guid id)
    {
        await Clients.Others.SendAsync("VoucherDeleted", id);
    }
}
