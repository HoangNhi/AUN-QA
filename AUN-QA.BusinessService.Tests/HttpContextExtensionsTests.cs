using System.Net;
using AUN_QA.Shared.Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace AUN_QA.BusinessService.Tests;

public class HttpContextExtensionsTests
{
    [Fact]
    public void GetClientIp_ReturnsIpv4_WhenRemoteIpIsPublicIpv4()
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("203.113.1.1");

        Assert.Equal("203.113.1.1", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_MapsToIpv4_WhenRemoteIpIsIpv4MappedToIpv6()
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("::ffff:203.113.1.1");

        Assert.Equal("203.113.1.1", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_ReturnsLoopback_WhenRemoteIpIsIPv6Loopback()
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = IPAddress.IPv6Loopback;

        Assert.Equal("127.0.0.1", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_ReturnsUnknown_WhenRemoteIpIsNull()
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = null;

        Assert.Equal("unknown", ctx.GetClientIp());
    }

    [Fact]
    public void AddTrustedForwardedHeaders_SetsForwardLimit()
    {
        var services = new ServiceCollection();
        services.AddTrustedForwardedHeaders(forwardLimit: 2);
        var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Equal(2, options.ForwardLimit);
    }

    [Fact]
    public void AddTrustedForwardedHeaders_TrustsHerokuNetwork()
    {
        var services = new ServiceCollection();
        services.AddTrustedForwardedHeaders(forwardLimit: 1);
        var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Contains(options.KnownNetworks,
            n => n.Prefix.Equals(IPAddress.Parse("10.0.0.0")) && n.PrefixLength == 8);
    }

    [Fact]
    public void AddTrustedForwardedHeaders_EnablesXForwardedForAndProto()
    {
        var services = new ServiceCollection();
        services.AddTrustedForwardedHeaders(forwardLimit: 1);
        var provider = services.BuildServiceProvider();

        var options = provider.GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.True(options.ForwardedHeaders.HasFlag(ForwardedHeaders.XForwardedFor));
        Assert.True(options.ForwardedHeaders.HasFlag(ForwardedHeaders.XForwardedProto));
    }
}
