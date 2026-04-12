using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.CoreFeature.ExternalReview.Dtos;
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

public class ExternalReviewAccountServiceTests
{
    [Fact]
    public async Task GetAccountsListAsync_ReturnsLinkedAccountsAndPassesPagingToSystemService()
    {
        await using var context = CreateContext();
        var reviewId = Guid.NewGuid();
        var otherReviewId = Guid.NewGuid();
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();

        SeedReview(context, reviewId, completed: false);
        SeedReview(context, otherReviewId, completed: false);
        var account1 = SeedAccount(context, reviewId, userId1);
        var account2 = SeedAccount(context, reviewId, userId2);
        _ = SeedAccount(context, otherReviewId, otherUserId);
        await context.SaveChangesAsync();

        var fakeInvoker = new FakeCallInvoker
        {
            GetUsersByIdsPagedHandler = request =>
            {
                Assert.Equal("pdca", request.TextSearch);
                Assert.Equal(1, request.PageIndex);
                Assert.Equal(10, request.PageSize);
                Assert.Equal(2, request.UserIds.Count);
                Assert.Contains(userId1.ToString(), request.UserIds);
                Assert.Contains(userId2.ToString(), request.UserIds);
                Assert.DoesNotContain(otherUserId.ToString(), request.UserIds);

                return new GetUsersByIdsPagedResponse
                {
                    PageIndex = 1,
                    PageSize = 10,
                    TotalRow = 2,
                    Users =
                    {
                        new UserInfo
                        {
                            Id = userId1.ToString(),
                            Fullname = "PDCA EXT 01",
                            Username = "pdca-ext01",
                            Email = "pdca-ext01@example.com",
                            IsActived = false,
                        },
                        new UserInfo
                        {
                            Id = userId2.ToString(),
                            Fullname = "PDCA EXT 02",
                            Username = "pdca-ext02",
                            Email = "pdca-ext02@example.com",
                            IsActived = true,
                        }
                    }
                };
            }
        };

        var service = CreateService(context, fakeInvoker);

        var result = await service.GetAccountsListAsync(new ExternalReviewAccountGetListRequest
        {
            ExternalReviewId = reviewId,
            PageIndex = 1,
            PageSize = 10,
            TextSearch = "pdca"
        });

        Assert.Equal(1, result.PageIndex);
        Assert.Equal(10, result.PageSize);
        Assert.Equal(2, result.TotalRow);
        Assert.Equal(2, result.Data.Count);
        Assert.Contains(result.Data, x => x.Id == account1.Id && x.Email == "pdca-ext01@example.com");
        Assert.Contains(result.Data, x => x.Id == account2.Id && x.Username == "pdca-ext02");
    }

    [Fact]
    public async Task UpdateAccountAsync_ReturnsUpdatedUserProfile()
    {
        await using var context = CreateContext();
        var reviewId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        SeedReview(context, reviewId, completed: false);
        var account = SeedAccount(context, reviewId, userId);
        await context.SaveChangesAsync();

        var fakeInvoker = new FakeCallInvoker
        {
            UpdateUserProfileHandler = request =>
            {
                Assert.Equal(userId.ToString(), request.UserId);
                Assert.Equal("Updated Reviewer", request.Fullname);
                Assert.Equal("updated-reviewer", request.Username);
                Assert.Equal("updated-reviewer@example.com", request.Email);

                return new UpdateUserProfileResponse
                {
                    Success = true,
                    User = new UserInfo
                    {
                        Id = userId.ToString(),
                        Fullname = "Updated Reviewer",
                        Username = "updated-reviewer",
                        Email = "updated-reviewer@example.com",
                        IsActived = true,
                    }
                };
            }
        };

        var service = CreateService(context, fakeInvoker);

        var result = await service.UpdateAccountAsync(new ExternalReviewAccountUpdateRequest
        {
            AccountId = account.Id,
            Fullname = "Updated Reviewer",
            Username = "updated-reviewer",
            Email = "updated-reviewer@example.com"
        });

        Assert.Equal(account.Id, result.Id);
        Assert.Equal("Updated Reviewer", result.Fullname);
        Assert.Equal("updated-reviewer", result.Username);
        Assert.Equal("updated-reviewer@example.com", result.Email);
    }

    [Fact]
    public async Task UpdateAccountAsync_RejectsCompletedReview()
    {
        await using var context = CreateContext();
        var reviewId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        SeedReview(context, reviewId, completed: true);
        _ = SeedAccount(context, reviewId, userId);
        await context.SaveChangesAsync();

        var service = CreateService(context, new FakeCallInvoker());

        var ex = await Assert.ThrowsAsync<BusinessException>(() =>
            service.UpdateAccountAsync(new ExternalReviewAccountUpdateRequest
            {
                AccountId = context.ExternalReviewAccounts.Single().Id,
                Fullname = "Updated Reviewer",
                Username = "updated-reviewer",
                Email = "updated-reviewer@example.com"
            }));

        Assert.Contains("hoàn tất", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static ExternalReviewService CreateService(BusinessContext context, FakeCallInvoker fakeInvoker)
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
            new SystemProto.SystemProtoClient(fakeInvoker));
    }

    private static void SeedReview(BusinessContext context, Guid reviewId, bool completed)
    {
        var cycleId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = 1,
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
            Status = completed ? 2 : 1,
            WatermarkOpacity = 25,
            WatermarkPosition = 0,
            IsCompleted = completed,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static ExternalReviewAccount SeedAccount(BusinessContext context, Guid reviewId, Guid userId)
    {
        var account = new ExternalReviewAccount
        {
            Id = Guid.NewGuid(),
            ExternalReviewId = reviewId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed"
        };

        context.ExternalReviewAccounts.Add(account);
        return account;
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public Func<GetUsersByIdsPagedRequest, GetUsersByIdsPagedResponse>? GetUsersByIdsPagedHandler { get; set; }
        public Func<UpdateUserProfileRequest, UpdateUserProfileResponse>? UpdateUserProfileHandler { get; set; }

        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
        {
            object response = method.Name switch
            {
                "GetUsersByIdsPaged" => GetUsersByIdsPagedHandler?.Invoke((GetUsersByIdsPagedRequest)(object)request)
                    ?? throw new InvalidOperationException("Missing GetUsersByIdsPaged handler."),
                "UpdateUserProfile" => UpdateUserProfileHandler?.Invoke((UpdateUserProfileRequest)(object)request)
                    ?? throw new InvalidOperationException("Missing UpdateUserProfile handler."),
                _ => throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}")
            };

            return new AsyncUnaryCall<TResponse>(
                System.Threading.Tasks.Task.FromResult((TResponse)response),
                System.Threading.Tasks.Task.FromResult(new Metadata()),
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
    }
}
