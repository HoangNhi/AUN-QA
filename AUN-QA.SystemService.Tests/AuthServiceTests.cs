using System.Reflection;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Dtos;
using AUN_QA.SystemService.DTOs.CoreFeature.Auth.Requests;
using AUN_QA.SystemService.Entities;
using AUN_QA.SystemService.Helpers;
using AUN_QA.SystemService.Infrastructure.Data;
using AUN_QA.SystemService.Services.CoreFeature.Auth;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Grpc.Core;
using Microsoft.AspNetCore.Http;

namespace AUN_QA.SystemService.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_RejectsExternalReviewerWhenBusinessServiceDeniesAccess()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        SeedExternalReviewer(context, userId, "ext-reviewer", "ext-reviewer@example.com", "secret");
        await context.SaveChangesAsync();

        var invoker = new FakeBusinessCallInvoker(hasAccess: false);
        var businessClient = CreateBusinessClient(invoker);
        var service = CreateService(context, businessClient);

        var method = typeof(AuthService).GetMethod(
            "LoginAsync",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        var loginTask = (Task<LoginResponse>)method!.Invoke(service, new object[]
        {
            new LoginRequest
            {
                Username = "ext-reviewer",
                Password = "secret"
            },
            "127.0.0.1"
        })!;

        var ex = await Assert.ThrowsAsync<BusinessException>(() => loginTask);

        Assert.Contains("không đúng", ex.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(userId.ToString(), invoker.CapturedUserId);
    }

    private static SystemContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SystemContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new SystemContext(options);
    }

    private static AuthService CreateService(SystemContext context, object businessClient)
    {
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddMaps(typeof(AuthProfile).Assembly);
        }, NullLoggerFactory.Instance);

        var accessor = new HttpContextAccessor();
        var config = new ConfigurationBuilder().Build();

        var constructor = typeof(AuthService).GetConstructors()
            .Single(c => c.GetParameters().Length == 5);

        return (AuthService)constructor.Invoke(new object[]
        {
            context,
            mapperConfig.CreateMapper(),
            accessor,
            config,
            businessClient
        });
    }

    private static object CreateBusinessClient(FakeBusinessCallInvoker invoker)
    {
        var clientType = typeof(AuthService).Assembly.GetType(
            "AUN_QA.BusinessService.Protos.BusinessProto+BusinessProtoClient");

        Assert.NotNull(clientType);

        return Activator.CreateInstance(clientType!, invoker)!;
    }

    private static void SeedExternalReviewer(
        SystemContext context,
        Guid id,
        string username,
        string email,
        string password)
    {
        var salt = Encrypt_DecryptHelper.GenerateSalt();

        context.Users.Add(new User
        {
            Id = id,
            Username = username,
            Fullname = "External Reviewer",
            Email = email,
            PasswordSalt = salt,
            Password = Encrypt_DecryptHelper.EncodePassword(password, salt),
            RoleId = new Guid("551d1351-008e-4910-a39c-1fcdde409fdf"),
            IsActived = true,
            IsDeleted = false,
            Avatar = string.Empty,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed"
        });
    }

    private sealed class FakeBusinessCallInvoker : CallInvoker
    {
        private readonly bool _hasAccess;
        public string? CapturedUserId { get; private set; }

        public FakeBusinessCallInvoker(bool hasAccess)
        {
            _hasAccess = hasAccess;
        }

        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
        {
            if (method.Name != "CheckExternalReviewerAccess")
            {
                throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
            }

            CapturedUserId = request?.GetType().GetProperty("UserId")?.GetValue(request) as string;

            var response = CreateGrpcResponse<TResponse>(_hasAccess);
            return new AsyncUnaryCall<TResponse>(
                Task.FromResult(response),
                Task.FromResult(new Metadata()),
                () => new Status(StatusCode.OK, string.Empty),
                () => new Metadata(),
                () => { });
        }

        public override TResponse BlockingUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();

        private static TResponse CreateGrpcResponse<TResponse>(bool hasAccess)
            where TResponse : class
        {
            var response = Activator.CreateInstance<TResponse>();
            var property = typeof(TResponse).GetProperty("HasAccess");
            if (property?.CanWrite == true)
            {
                property.SetValue(response, hasAccess);
            }

            return response;
        }
    }
}
