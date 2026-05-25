using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace AmcVoucherManager.WebApi.Hubs;

[Authorize]
public class VoucherHub : Hub
{
}
