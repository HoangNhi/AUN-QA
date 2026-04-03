using Microsoft.AspNetCore.Http;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar;

public sealed record SarTransitionAuditPayload(
    string From,
    string To,
    string Action,
    string? Reason,
    string ChangedBy,
    DateTime ChangedAt)
{
    public Dictionary<string, object?> ToAuditDictionary()
    {
        return new Dictionary<string, object?>
        {
            ["from"] = From,
            ["to"] = To,
            ["action"] = Action,
            ["reason"] = Reason,
            ["changedBy"] = ChangedBy,
            ["changedAt"] = ChangedAt
        };
    }
}

public static class SarAuditTrail
{
    public const string TransitionPayloadItemKey = "SarTransitionAuditPayload_Business";
    public const string TransitionGroupName = "SarTransition";

    public static SarTransitionAuditPayload CreateTransitionPayload(
        int fromStatus,
        int toStatus,
        string action,
        string? reason,
        string changedBy,
        DateTime changedAt)
    {
        return new SarTransitionAuditPayload(
            From: StatusName(fromStatus),
            To: StatusName(toStatus),
            Action: action,
            Reason: reason,
            ChangedBy: changedBy,
            ChangedAt: changedAt);
    }

    public static void SetTransitionPayload(HttpContext? context, SarTransitionAuditPayload payload)
    {
        if (context == null)
        {
            return;
        }

        context.Items[TransitionPayloadItemKey] = payload;
    }

    public static SarTransitionAuditPayload? GetTransitionPayload(HttpContext? context)
    {
        return context?.Items[TransitionPayloadItemKey] as SarTransitionAuditPayload;
    }

    public static void ClearTransitionPayload(HttpContext? context)
    {
        context?.Items.Remove(TransitionPayloadItemKey);
    }

    public static void AddTransitionToAuditValues(
        Dictionary<string, List<Dictionary<string, object?>>> newValuesGroup,
        HttpContext? context)
    {
        var payload = GetTransitionPayload(context);
        if (payload == null)
        {
            return;
        }

        AddToGroup(newValuesGroup, TransitionGroupName, payload.ToAuditDictionary());
    }

    private static string StatusName(int status)
    {
        return Enum.GetName(typeof(AUN_QA.BusinessService.DTOs.Common.SarStatus), status) ?? status.ToString();
    }

    private static void AddToGroup(
        Dictionary<string, List<Dictionary<string, object?>>> group,
        string entityName,
        Dictionary<string, object?> values)
    {
        if (values.Count == 0)
        {
            return;
        }

        if (!group.ContainsKey(entityName))
        {
            group[entityName] = new List<Dictionary<string, object?>>();
        }

        group[entityName].Add(values);
    }
}
