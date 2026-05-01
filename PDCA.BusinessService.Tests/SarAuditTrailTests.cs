using System.Text.Json;
using AUN_QA.BusinessService.Infrastructure.Interceptors;
using AUN_QA.BusinessService.Services.CoreFeature.Sar;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace AUN_QA.BusinessService.Tests;

public class SarAuditTrailTests
{
    [Theory]
    [InlineData(1, 2, "submit", null, "Draft", "Submitted")]
    [InlineData(2, 3, "request-revision", "Please update the scope", "Submitted", "RevisionRequested")]
    [InlineData(2, 4, "approve", null, "Submitted", "Approved")]
    public void SarAuditTrail_builds_expected_transition_payload(
        int fromStatus,
        int toStatus,
        string action,
        string? reason,
        string expectedFrom,
        string expectedTo)
    {
        var changedAt = new DateTime(2026, 4, 3, 9, 30, 15, DateTimeKind.Utc);

        var payload = SarAuditTrail.CreateTransitionPayload(
            fromStatus,
            toStatus,
            action,
            reason,
            "reviewer.one",
            changedAt);

        var auditValues = payload.ToAuditDictionary();

        Assert.Equal(expectedFrom, auditValues["from"]);
        Assert.Equal(expectedTo, auditValues["to"]);
        Assert.Equal(action, auditValues["action"]);
        Assert.Equal(reason, auditValues["reason"]);
        Assert.Equal("reviewer.one", auditValues["changedBy"]);
        Assert.Equal(changedAt, Assert.IsType<DateTime>(auditValues["changedAt"]));
    }

    [Theory]
    [InlineData(1, 2, "submit", null)]
    [InlineData(2, 3, "request-revision", "Please update the scope")]
    [InlineData(2, 4, "approve", null)]
    public void SarAuditTrail_adds_transition_payload_to_outgoing_audit_values(
        int fromStatus,
        int toStatus,
        string action,
        string? reason)
    {
        var httpContext = new DefaultHttpContext();
        var changedAt = new DateTime(2026, 4, 3, 9, 30, 15, DateTimeKind.Utc);

        var payload = SarAuditTrail.CreateTransitionPayload(
            fromStatus,
            toStatus,
            action,
            reason,
            "reviewer.one",
            changedAt);

        SarAuditTrail.SetTransitionPayload(httpContext, payload);

        var newValuesGroup = new Dictionary<string, List<Dictionary<string, object?>>>
        {
            ["SarReport"] = new()
            {
                new Dictionary<string, object?>
                {
                    ["Status"] = fromStatus,
                    ["UpdatedBy"] = "reviewer.one"
                }
            }
        };

        SarAuditTrail.AddTransitionToAuditValues(newValuesGroup, httpContext);

        var json = JsonSerializer.Serialize(newValuesGroup);
        using var document = JsonDocument.Parse(json);

        var transitionEntry = document.RootElement.GetProperty("SarTransition")[0];

        Assert.Equal(payload.From, transitionEntry.GetProperty("from").GetString());
        Assert.Equal(payload.To, transitionEntry.GetProperty("to").GetString());
        Assert.Equal(payload.Action, transitionEntry.GetProperty("action").GetString());
        Assert.Equal(payload.ChangedBy, transitionEntry.GetProperty("changedBy").GetString());
        Assert.Equal(changedAt, transitionEntry.GetProperty("changedAt").GetDateTime());

        if (reason == null)
        {
            Assert.Equal(JsonValueKind.Null, transitionEntry.GetProperty("reason").ValueKind);
        }
        else
        {
            Assert.Equal(reason, transitionEntry.GetProperty("reason").GetString());
        }
    }

    [Fact]
    public void SarAuditTrail_clears_transition_payload_and_stops_appending_after_cleanup()
    {
        var httpContext = new DefaultHttpContext();
        var payload = SarAuditTrail.CreateTransitionPayload(
            fromStatus: 2,
            toStatus: 4,
            action: "approve",
            reason: null,
            changedBy: "reviewer.one",
            changedAt: new DateTime(2026, 4, 3, 9, 30, 15, DateTimeKind.Utc));

        SarAuditTrail.SetTransitionPayload(httpContext, payload);

        Assert.NotNull(SarAuditTrail.GetTransitionPayload(httpContext));

        SarAuditTrail.ClearTransitionPayload(httpContext);

        Assert.Null(SarAuditTrail.GetTransitionPayload(httpContext));

        var newValuesGroup = new Dictionary<string, List<Dictionary<string, object?>>>
        {
            ["SarReport"] = new()
            {
                new Dictionary<string, object?>
                {
                    ["Status"] = 4
                }
            }
        };

        SarAuditTrail.AddTransitionToAuditValues(newValuesGroup, httpContext);

        Assert.DoesNotContain("SarTransition", newValuesGroup.Keys);
    }

    [Fact]
    public async Task AuditInterceptor_clears_transition_payload_on_save_failed()
    {
        var httpContext = new DefaultHttpContext();
        SarAuditTrail.SetTransitionPayload(
            httpContext,
            SarAuditTrail.CreateTransitionPayload(
                fromStatus: 2,
                toStatus: 4,
                action: "approve",
                reason: null,
                changedBy: "reviewer.one",
                changedAt: new DateTime(2026, 4, 3, 9, 30, 15, DateTimeKind.Utc)));

        var interceptor = new AuditInterceptor(
            new HttpContextAccessor { HttpContext = httpContext },
            auditClient: null!,
            logger: NullLogger<AuditInterceptor>.Instance);

        await interceptor.SaveChangesFailedAsync(null!);

        Assert.Null(SarAuditTrail.GetTransitionPayload(httpContext));
    }

    [Fact]
    public async Task AuditInterceptor_clears_transition_payload_on_save_canceled()
    {
        var httpContext = new DefaultHttpContext();
        SarAuditTrail.SetTransitionPayload(
            httpContext,
            SarAuditTrail.CreateTransitionPayload(
                fromStatus: 1,
                toStatus: 2,
                action: "submit",
                reason: null,
                changedBy: "reviewer.one",
                changedAt: new DateTime(2026, 4, 3, 9, 30, 15, DateTimeKind.Utc)));

        var interceptor = new AuditInterceptor(
            new HttpContextAccessor { HttpContext = httpContext },
            auditClient: null!,
            logger: NullLogger<AuditInterceptor>.Instance);

        await interceptor.SaveChangesCanceledAsync(null!);

        Assert.Null(SarAuditTrail.GetTransitionPayload(httpContext));
    }
}
