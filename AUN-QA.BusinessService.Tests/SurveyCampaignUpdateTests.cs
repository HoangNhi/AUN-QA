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

public class SurveyCampaignUpdateTests
{
    [Fact]
    public async Task Update_replaces_existing_topics_and_soft_deletes_removed_children()
    {
        await using var context = CreateContext();
        var service = CreateService(context);

        var campaignId = Guid.NewGuid();
        var cycleId = Guid.NewGuid();

        await service.Insert(new SurveyCampaignRequest
        {
            Id = campaignId,
            CycleId = cycleId,
            TemplateId = Guid.NewGuid(),
            StakeholderType = 1,
            Name = "Student survey",
            ListTopic =
            [
                new TemplateTopicRequest
                {
                    Id = Guid.NewGuid(),
                    Title = "Old topic",
                    Sort = 1,
                    HasTextQuestionPart = true,
                    TextQuestionTitle = "Other",
                    ListCategory =
                    [
                        new TemplateCategoryRequest
                        {
                            Id = Guid.NewGuid(),
                            TopicId = Guid.NewGuid(),
                            Name = "Old category",
                            Sort = 1,
                            ListQuestion =
                            [
                                new TemplateQuestionRequest
                                {
                                    Id = Guid.NewGuid(),
                                    CategoryId = Guid.NewGuid(),
                                    Content = "Old question",
                                    Sort = 1
                                }
                            ]
                        }
                    ],
                    ListTextQuestion =
                    [
                        new TemplateTextQuestionRequest
                        {
                            Id = Guid.NewGuid(),
                            TopicId = Guid.NewGuid(),
                            Content = "Old text question",
                            Sort = 1
                        }
                    ]
                }
            ]
        });

        var originalTopic = await context.TemplateTopics.SingleAsync(x => x.CampaignId == campaignId && !x.IsDeleted);
        var originalCategory = await context.TemplateCategories.SingleAsync(x => x.TopicId == originalTopic.Id && !x.IsDeleted);
        var originalQuestion = await context.TemplateQuestions.SingleAsync(x => x.CategoryId == originalCategory.Id && !x.IsDeleted);
        var originalTextQuestion = await context.TemplateTextQuestions.SingleAsync(x => x.TopicId == originalTopic.Id && !x.IsDeleted);

        await service.Update(new SurveyCampaignRequest
        {
            Id = campaignId,
            CycleId = cycleId,
            TemplateId = Guid.NewGuid(),
            StakeholderType = 1,
            Name = "Student survey updated",
            Status = 1,
            ListTopic =
            [
                new TemplateTopicRequest
                {
                    Id = Guid.NewGuid(),
                    Title = "New topic",
                    Sort = 1,
                    HasTextQuestionPart = true,
                    TextQuestionTitle = "New other",
                    ListCategory =
                    [
                        new TemplateCategoryRequest
                        {
                            Id = Guid.NewGuid(),
                            TopicId = Guid.NewGuid(),
                            Name = "New category",
                            Sort = 1,
                            ListQuestion =
                            [
                                new TemplateQuestionRequest
                                {
                                    Id = Guid.NewGuid(),
                                    CategoryId = Guid.NewGuid(),
                                    Content = "New question",
                                    Sort = 1
                                }
                            ]
                        }
                    ],
                    ListTextQuestion =
                    [
                        new TemplateTextQuestionRequest
                        {
                            Id = Guid.NewGuid(),
                            TopicId = Guid.NewGuid(),
                            Content = "New text question",
                            Sort = 1
                        }
                    ]
                }
            ]
        });

        var oldTopic = await context.TemplateTopics.SingleAsync(x => x.Id == originalTopic.Id);
        var oldCategory = await context.TemplateCategories.SingleAsync(x => x.Id == originalCategory.Id);
        var oldQuestion = await context.TemplateQuestions.SingleAsync(x => x.Id == originalQuestion.Id);
        var oldTextQuestion = await context.TemplateTextQuestions.SingleAsync(x => x.Id == originalTextQuestion.Id);

        Assert.True(oldTopic.IsDeleted);
        Assert.True(oldCategory.IsDeleted);
        Assert.True(oldQuestion.IsDeleted);
        Assert.True(oldTextQuestion.IsDeleted);

        var activeTopics = await context.TemplateTopics
            .Where(x => x.CampaignId == campaignId && !x.IsDeleted)
            .ToListAsync();
        var activeCategories = await context.TemplateCategories
            .Where(x => !x.IsDeleted)
            .ToListAsync();
        var activeQuestions = await context.TemplateQuestions
            .Where(x => !x.IsDeleted)
            .ToListAsync();
        var activeTextQuestions = await context.TemplateTextQuestions
            .Where(x => !x.IsDeleted)
            .ToListAsync();

        Assert.Single(activeTopics);
        Assert.Single(activeCategories);
        Assert.Single(activeQuestions);
        Assert.Single(activeTextQuestions);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new BusinessContext(options);
    }

    private static SurveyCampaignService CreateService(BusinessContext context)
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
}
