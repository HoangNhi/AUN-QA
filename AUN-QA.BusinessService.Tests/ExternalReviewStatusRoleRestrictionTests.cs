using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.ExternalReview;
using AUN_QA.Shared.Exceptions;
using AUN_QA.SystemService.Protos;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class ExternalReviewStatusRoleRestrictionTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public async Task UpdateStatusAsync_AllowsCouncilLeadershipRoles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, reviewId) = SeedCycleAndReview(context, status: 0);
        SeedCouncil(context, cycleId, userId, roleId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        await service.UpdateStatusAsync(new ExternalReviewStatusRequest
        {
            Id = reviewId,
            Status = 1
        });
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task UpdateStatusAsync_RejectsUnauthorizedRoles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, reviewId) = SeedCycleAndReview(context, status: 0);
        SeedCouncil(context, cycleId, userId, roleId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateStatusAsync(new ExternalReviewStatusRequest
            {
                Id = reviewId,
                Status = 1
            }));
    }

    [Fact]
    public async Task UpdateStatusAsync_RejectsUsersOutsideCouncil()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (_, reviewId) = SeedCycleAndReview(context, status: 0);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateStatusAsync(new ExternalReviewStatusRequest
            {
                Id = reviewId,
                Status = 1
            }));
    }

    [Fact]
    public async Task UpdateStatusAsync_AllowsAdminBypass()
    {
        await using var context = CreateContext();
        var (_, reviewId) = SeedCycleAndReview(context, status: 0);
        await context.SaveChangesAsync();

        var service = CreateAdminService(context);

        await service.UpdateStatusAsync(new ExternalReviewStatusRequest
        {
            Id = reviewId,
            Status = 1
        });
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    public async Task ConfirmCompletionAsync_AllowsCouncilLeadershipRoles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, reviewId) = SeedCycleAndReview(context, status: 1);
        SeedCouncil(context, cycleId, userId, roleId);
        SeedResult(context, reviewId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        await service.ConfirmCompletionAsync(reviewId);
    }

    [Theory]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    public async Task ConfirmCompletionAsync_RejectsUnauthorizedRoles(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, reviewId) = SeedCycleAndReview(context, status: 1);
        SeedCouncil(context, cycleId, userId, roleId);
        SeedResult(context, reviewId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        await Assert.ThrowsAsync<BusinessException>(() =>
            service.ConfirmCompletionAsync(reviewId));
    }

    [Fact]
    public async Task ConfirmCompletionAsync_AllowsAdminBypass()
    {
        await using var context = CreateContext();
        var (_, reviewId) = SeedCycleAndReview(context, status: 1);
        SeedResult(context, reviewId);
        await context.SaveChangesAsync();

        var service = CreateAdminService(context);

        await service.ConfirmCompletionAsync(reviewId);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    public async Task GetByCycleIdAsync_ReturnsCouncilRoleAndNonAdminFlag(int roleId)
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, _) = SeedCycleAndReview(context, status: 0);
        SeedCouncil(context, cycleId, userId, roleId);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        var result = await service.GetByCycleIdAsync(cycleId);

        Assert.NotNull(result);
        Assert.Equal(roleId, result!.CurrentUserCouncilRoleId);
        Assert.False(result.IsAdmin);
    }

    [Fact]
    public async Task GetByCycleIdAsync_ReturnsNullRoleWhenUserIsNotInCouncil()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var (cycleId, _) = SeedCycleAndReview(context, status: 0);
        await context.SaveChangesAsync();

        var service = CreateServiceForUser(context, userId);

        var result = await service.GetByCycleIdAsync(cycleId);

        Assert.NotNull(result);
        Assert.Null(result!.CurrentUserCouncilRoleId);
        Assert.False(result.IsAdmin);
    }

    [Fact]
    public async Task GetByCycleIdAsync_AdminBypassesCouncilLookup()
    {
        await using var context = CreateContext();
        var (cycleId, _) = SeedCycleAndReview(context, status: 0);
        await context.SaveChangesAsync();

        var service = CreateAdminService(context);

        var result = await service.GetByCycleIdAsync(cycleId);

        Assert.NotNull(result);
        Assert.Null(result!.CurrentUserCouncilRoleId);
        Assert.True(result.IsAdmin);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static ExternalReviewService CreateServiceForUser(BusinessContext context, Guid userId)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.Name, "council-member"),
                        new Claim("name", userId.ToString()),
                    },
                    authenticationType: "TestAuth"))
            }
        };

        return new ExternalReviewService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()));
    }

    private static ExternalReviewService CreateAdminService(BusinessContext context)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.Name, "admin"),
                    },
                    authenticationType: "TestAuth"))
            }
        };

        return new ExternalReviewService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(new FakeCallInvoker()));
    }

    private static (Guid cycleId, Guid reviewId) SeedCycleAndReview(
        BusinessContext context,
        int status,
        bool completed = false)
    {
        var cycleId = Guid.NewGuid();
        var reviewId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Test Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = 3,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        context.ExternalReviews.Add(new ExternalReview
        {
            Id = reviewId,
            CycleId = cycleId,
            Status = status,
            WatermarkOpacity = 25,
            WatermarkPosition = 0,
            IsCompleted = completed,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });

        return (cycleId, reviewId);
    }

    private static void SeedCouncil(BusinessContext context, Guid cycleId, Guid userId, int roleId)
    {
        context.Councils.Add(new Council
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            UserId = userId,
            RoleId = roleId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedResult(BusinessContext context, Guid reviewId)
    {
        context.ExternalReviewResults.Add(new ExternalReviewResult
        {
            Id = Guid.NewGuid(),
            ExternalReviewId = reviewId,
            StandardId = Guid.NewGuid(),
            Strengths = "Test strengths",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public override TResponse BlockingUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string? host,
            CallOptions options,
            TRequest request)
        {
            throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
        }

        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string? host,
            CallOptions options,
            TRequest request)
        {
            throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
        }

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string? host,
            CallOptions options)
        {
            throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
        }

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string? host,
            CallOptions options)
        {
            throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
        }

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string? host,
            CallOptions options,
            TRequest request)
        {
            throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
        }
    }
}
