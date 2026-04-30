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
    public void GetClientIp_ReturnsFirstXffValue_WhenXffHasMultipleIps()
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Headers["X-Forwarded-For"] = "103.156.2.49, 44.192.18.132";
        ctx.Connection.RemoteIpAddress = IPAddress.Loopback;

        Assert.Equal("103.156.2.49", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_PrefersXffOverRemoteIpAddress()
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Headers["X-Forwarded-For"] = "103.156.2.49";
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("44.192.18.132");

        Assert.Equal("103.156.2.49", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_ReturnsXRealIp_WhenXffIsAbsent()
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Headers["X-Real-IP"] = "103.156.2.49";
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("44.192.18.132");

        Assert.Equal("103.156.2.49", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_FallsBackToRemoteIp_WhenNoXffOrXRealIp()
    {
        var ctx = new DefaultHttpContext();
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("203.113.1.1");

        Assert.Equal("203.113.1.1", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_MapsXffIpv4MappedIpv6ToIpv4()
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Headers["X-Forwarded-For"] = "::ffff:103.156.2.49";

        Assert.Equal("103.156.2.49", ctx.GetClientIp());
    }

    [Fact]
    public void GetClientIp_FallsBackToRemoteIp_WhenXffIsInvalidIp()
    {
        var ctx = new DefaultHttpContext();
        ctx.Request.Headers["X-Forwarded-For"] = "not-an-ip, also-bad";
        ctx.Connection.RemoteIpAddress = IPAddress.Parse("203.113.1.1");

        Assert.Equal("203.113.1.1", ctx.GetClientIp());
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
