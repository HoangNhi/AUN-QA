using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NSubstitute;

namespace AUN_QA.BusinessService.Tests;

public class ExternalReviewCycleVisibilityTests
{
    [Fact]
    public async Task GetCycleIdsByUserAsync_IncludesInProgressExternalReviewCycles()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = Guid.NewGuid();
        var reviewId = Guid.NewGuid();

        SeedCycle(context, cycleId, "Chu kỳ ĐGN", 2026);
        SeedExternalReview(context, reviewId, cycleId, ExternalReviewStatus.InProgress);
        SeedExternalReviewAccount(context, reviewId, userId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var result = await service.GetCycleIdsByUserAsync(userId);

        Assert.Contains(cycleId, result);
    }

    [Fact]
    public async Task GetCycleIdsByUserAsync_ExcludesNewOrCompletedExternalReviewCycles()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var newCycleId = Guid.NewGuid();
        var completedCycleId = Guid.NewGuid();

        SeedCycle(context, newCycleId, "Cycle New", 2026);
        SeedCycle(context, completedCycleId, "Cycle Completed", 2026);

        var newReviewId = Guid.NewGuid();
        var completedReviewId = Guid.NewGuid();

        SeedExternalReview(context, newReviewId, newCycleId, ExternalReviewStatus.New);
        SeedExternalReview(context, completedReviewId, completedCycleId, ExternalReviewStatus.Completed, completed: true);

        SeedExternalReviewAccount(context, newReviewId, userId);
        SeedExternalReviewAccount(context, completedReviewId, userId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var result = await service.GetCycleIdsByUserAsync(userId);

        Assert.Empty(result);
    }

    [Fact]
    public async Task GetComboboxByUser_IncludesInProgressExternalReviewCycles()
    {
        await using var context = CreateContext();
        var userId = Guid.NewGuid();
        var cycleId = Guid.NewGuid();
        var reviewId = Guid.NewGuid();

        SeedCycle(context, cycleId, "Chu kỳ ĐGN 2026", 2026);
        SeedExternalReview(context, reviewId, cycleId, ExternalReviewStatus.InProgress);
        SeedExternalReviewAccount(context, reviewId, userId);
        await context.SaveChangesAsync();

        var service = CreateService(context, userId);
        var result = await service.GetComboboxByUser();

        Assert.Single(result);
        Assert.Equal(cycleId.ToString(), result[0].Value);
        Assert.Equal("Chu kỳ ĐGN 2026", result[0].Text);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static CycleService CreateService(BusinessContext context, Guid userId)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[] { new Claim("name", userId.ToString()) },
                authenticationType: "TestAuth"))
            }
        };

        return new CycleService(
            context,
            null!,
            accessor,
            Substitute.For<ICatalogIntegrationService>());
    }

    private static void SeedCycle(BusinessContext context, Guid cycleId, string name, int year)
    {
        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = name,
            Year = year,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = 2,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedExternalReview(
        BusinessContext context,
        Guid reviewId,
        Guid cycleId,
        ExternalReviewStatus status,
        bool completed = false)
    {
        context.ExternalReviews.Add(new ExternalReview
        {
            Id = reviewId,
            CycleId = cycleId,
            Status = (int)status,
            WatermarkOpacity = 25,
            WatermarkPosition = 0,
            IsCompleted = completed,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed",
            IsActived = true,
            IsDeleted = false
        });
    }

    private static void SeedExternalReviewAccount(BusinessContext context, Guid reviewId, Guid userId)
    {
        context.ExternalReviewAccounts.Add(new ExternalReviewAccount
        {
            Id = Guid.NewGuid(),
            ExternalReviewId = reviewId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "seed"
        });
    }
}
