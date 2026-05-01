using System.Data.SqlTypes;
using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Background;
using AUN_QA.BusinessService.Services.Commons.Email;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.Survey;
using AUN_QA.BusinessService.Services.CoreFeature.SurveyCampaign;
using AUN_QA.BusinessService.Services.CoreFeature.SurveyTemplate;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace AUN_QA.BusinessService.Tests;

public class SurveyCampaignInsertTests
{
    [Fact]
    public async Task Insert_does_not_track_sql_datetime_overflow_values()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        await service.Insert(new SurveyCampaignRequest
        {
            CycleId = Guid.NewGuid(),
            TemplateId = Guid.NewGuid(),
            StakeholderType = 1,
            Name = "Student survey",
            ListTopic =
            [
                new TemplateTopicRequest
                {
                    Title = "Teaching quality",
                    Sort = 0,
                    HasTextQuestionPart = true,
                    TextQuestionTitle = "Other feedback",
                    ListCategory =
                    [
                        new TemplateCategoryRequest
                        {
                            TopicId = Guid.NewGuid(),
                            Name = "Lecturer",
                            Sort = 0,
                            ListQuestion =
                            [
                                new TemplateQuestionRequest
                                {
                                    CategoryId = Guid.NewGuid(),
                                    Content = "Question 1",
                                    Sort = 0
                                }
                            ]
                        }
                    ],
                    ListTextQuestion =
                    [
                        new TemplateTextQuestionRequest
                        {
                            TopicId = Guid.NewGuid(),
                            Content = "Question text",
                            Sort = 0
                        }
                    ]
                }
            ]
        });
    }

    private static TrackingBusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new TrackingBusinessContext(options);
    }

    private static SurveyCampaignService CreateService(TrackingBusinessContext context)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, "tester"),
            new("unique_name", "tester"),
            new("name", Guid.NewGuid().ToString())
        };

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"))
            }
        };

        var cycleService = Substitute.For<ICycleService>();
        cycleService.GetCycleStatusAsync(Arg.Any<Guid>()).Returns((true, 2));
        cycleService.CanUserDoActionInPdcaAsync(Arg.Any<AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests.PdcaActionCheckRequest>())
            .Returns(true);
        cycleService.IsRevisionAllowedAsync(Arg.Any<Guid>()).Returns(false);

        var mapper = new Mapper(
            new MapperConfiguration(cfg =>
            {
                cfg.AddProfile(new SurveyCampaignProfile());
                cfg.AddProfile(new SurveyTemplateProfile());
            }, NullLoggerFactory.Instance));

        return new SurveyCampaignService(
            context,
            mapper,
            accessor,
            Substitute.For<ICatalogIntegrationService>(),
            cycleService,
            Substitute.For<IBackgroundTaskQueue>(),
            Substitute.For<IEmailService>(),
            new ConfigurationBuilder().AddInMemoryCollection().Build());
    }

    private sealed class TrackingBusinessContext(DbContextOptions<BusinessContext> options) : BusinessContext(options)
    {
        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            var minSqlDateTime = (DateTime)SqlDateTime.MinValue;
            var invalidValues = ChangeTracker.Entries()
                .Where(entry => entry.State is EntityState.Added or EntityState.Modified)
                .SelectMany(entry => entry.Properties
                    .Where(property => property.Metadata.ClrType == typeof(DateTime) || property.Metadata.ClrType == typeof(DateTime?))
                    .Select(property => new
                    {
                        Entry = entry,
                        Property = property.Metadata.Name,
                        Value = property.CurrentValue is DateTime value ? value : property.CurrentValue as DateTime?
                    }))
                .Where(x => x.Value.HasValue && x.Value.Value < minSqlDateTime)
                .Select(x => $"{x.Entry.Entity.GetType().Name}.{x.Property}={x.Value:O}")
                .ToList();

            if (invalidValues.Count != 0)
            {
                throw new Xunit.Sdk.XunitException($"Tracked SQL datetime overflow values: {string.Join(", ", invalidValues)}");
            }

            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
