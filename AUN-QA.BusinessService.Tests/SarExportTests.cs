using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.Cycle.Requests;
using AUN_QA.BusinessService.Entities;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.CoreFeature.Cycle;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Tests;

public class SarExportTests
{
    [Fact]
    public void SanitizeListItems_RemovesParagraphInsideSingleListItem()
    {
        var input = "<ul><li><p>Hello world</p></li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ul><li>Hello world</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_RemovesParagraphWithInlineHtml()
    {
        var input = "<ul><li><p><strong>Thành viên:</strong> \"Mô tả\"</p></li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ul><li><strong>Thành viên:</strong> \"Mô tả\"</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_HandlesMultipleListItems()
    {
        var input = "<ul><li><p>First</p></li><li><p>Second</p></li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ul><li>First</li><li>Second</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_LeavesListItemsWithoutParagraphUntouched()
    {
        var input = "<ul><li>Already clean</li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ul><li>Already clean</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_LeavesStandaloneParagraphsUntouched()
    {
        var input = "<p>Normal paragraph</p><ul><li><p>Item</p></li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<p>Normal paragraph</p><ul><li>Item</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_HandlesWhitespaceAroundParagraph()
    {
        var input = "<ul><li>\n  <p>Spaced</p>\n</li></ul>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ul><li>Spaced</li></ul>", result);
    }

    [Fact]
    public void SanitizeListItems_HandlesOrderedList()
    {
        var input = "<ol><li><p>Ordered item</p></li></ol>";

        var result = HtmlWordExportHelper.SanitizeListItems(input);

        Assert.Equal("<ol><li>Ordered item</li></ol>", result);
    }

    [Fact]
    public void BuildExportHtml_ContainsWordCompatibleListCss()
    {
        var result = HtmlWordExportHelper.BuildExportHtmlDocument("<p>test</p>");

        Assert.Contains("li > p", result);
        Assert.Contains("display: inline", result);
        Assert.Contains("margin: 0", result);
        Assert.Contains("padding: 0", result);
    }

    [Theory]
    [InlineData((int)SarStatus.Draft)]
    [InlineData((int)SarStatus.Submitted)]
    [InlineData((int)SarStatus.RevisionRequested)]
    [InlineData((int)SarStatus.Approved)]
    public async Task ExportDocx_allows_every_SAR_status(int status)
    {
        await using var context = CreateContext();
        var (service, cycleId) = await CreateServiceAsync(context, status);

        context.SarReports.Add(new SarReport
        {
            Id = Guid.NewGuid(),
            CycleId = cycleId,
            Status = status,
            RenderedHtml = "<p>Exportable content</p>",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var result = await service.ExportDocx(new AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests.ExportSarDocxRequest
        {
            CycleId = cycleId
        });

        Assert.NotEmpty(result);
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .Options;

        return new BusinessContext(options);
    }

    private static async Task<(SarService Service, Guid CycleId)> CreateServiceAsync(
        BusinessContext context,
        int cycleStatus)
    {
        var cycleId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        context.Cycles.Add(new Cycle
        {
            Id = cycleId,
            Name = "Cycle",
            Year = 2026,
            StartDate = DateTime.UtcNow.AddDays(-10),
            EndDate = DateTime.UtcNow.AddDays(10),
            Status = cycleStatus,
            EvaluationPurpose = "Test",
            Scope = 1,
            StandardSetId = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            IsActived = true,
            IsDeleted = false
        });
        await context.SaveChangesAsync();

        var httpContext = new DefaultHttpContext
        {
            User = new ClaimsPrincipal(new ClaimsIdentity(
                new[]
                {
                    new Claim("name", userId.ToString()),
                    new Claim("unique_name", "tester.user"),
                },
                authenticationType: "TestAuth"))
        };

        return (
            new SarService(
                context,
                new HttpContextAccessor { HttpContext = httpContext },
                new FakeCycleService(cycleId, cycleStatus),
                null!,
                null!),
            cycleId);
    }

    private sealed class FakeCycleService : ICycleService
    {
        private readonly Guid _cycleId;
        private readonly int _cycleStatus;

        public FakeCycleService(Guid cycleId, int cycleStatus)
        {
            _cycleId = cycleId;
            _cycleStatus = cycleStatus;
        }

        public Task<ModelCycle> GetById(GetByIdRequest request) => throw new NotImplementedException();

        public Task Insert(CycleRequest request) => throw new NotImplementedException();

        public Task Update(CycleRequest request) => throw new NotImplementedException();

        public Task DeleteList(DeleteListRequest request) => throw new NotImplementedException();

        public Task<GetListPagingResponse<ModelCycleGetListPaging>> GetList(CycleGetListPagingRequest request) => throw new NotImplementedException();

        public Task<List<ModelCombobox>> GetComboboxByUser() => throw new NotImplementedException();

        public Task ChangeStatusAsync(CycleChangeStatusRequest request) => throw new NotImplementedException();

        public Task<bool> CanUserDoActionInPdcaAsync(PdcaActionCheckRequest request) => Task.FromResult(true);

        public Task<bool> IsUserInRoleAsync(Guid cycleId, Guid userId, int role) => Task.FromResult(true);

        public Task<int?> GetUserRoleAsync(Guid cycleId, Guid userId) => Task.FromResult<int?>(null);

        public Task<List<Guid>> GetCycleIdsByUserAsync(Guid userId) => Task.FromResult(new List<Guid>());

        public Task<(bool Found, int Status)> GetCycleStatusAsync(Guid cycleId)
            => Task.FromResult((cycleId == _cycleId, _cycleStatus));
    }
}
