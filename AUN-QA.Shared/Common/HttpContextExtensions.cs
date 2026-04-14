using System.Net;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.DependencyInjection;

namespace AUN_QA.Shared.Common;

public static class HttpContextExtensions
{
    public static string GetClientIp(this HttpContext context)
    {
        ArgumentNullException.ThrowIfNull(context);

        var remoteIp = context.Connection.RemoteIpAddress;
        if (remoteIp is null)
        {
            return "unknown";
        }

        if (remoteIp.IsIPv4MappedToIPv6)
        {
            return remoteIp.MapToIPv4().ToString();
        }

        if (remoteIp.Equals(IPAddress.IPv6Loopback))
        {
            return IPAddress.Loopback.ToString();
        }

        return remoteIp.ToString();
    }

    public static void AddTrustedForwardedHeaders(this IServiceCollection services, int forwardLimit = 1)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

            options.KnownNetworks.Clear();
            options.KnownProxies.Clear();

            options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
            options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("172.16.0.0"), 12));
            options.KnownNetworks.Add(new Microsoft.AspNetCore.HttpOverrides.IPNetwork(IPAddress.Parse("192.168.0.0"), 16));

            options.KnownProxies.Add(IPAddress.Loopback);
            options.KnownProxies.Add(IPAddress.IPv6Loopback);

            options.ForwardLimit = forwardLimit;
        });
    }

    public static void UseTrustedForwardedHeaders(this IApplicationBuilder app)
    {
        ArgumentNullException.ThrowIfNull(app);
        app.UseForwardedHeaders();
    }
}
