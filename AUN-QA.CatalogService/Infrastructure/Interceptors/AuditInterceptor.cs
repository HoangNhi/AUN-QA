using System.Text.Json;
using AUN_QA.SystemService.Protos;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace AUN_QA.CatalogService.Infrastructure.Interceptors;

public class AuditInterceptor : SaveChangesInterceptor
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly AuditProto.AuditProtoClient _auditClient;
    private readonly ILogger<AuditInterceptor> _logger;

    private static readonly HashSet<string> ExcludedProperties = new(StringComparer.OrdinalIgnoreCase)
    {
        "Password", "PasswordSalt", "Token"
    };

    public AuditInterceptor(
        IHttpContextAccessor httpContextAccessor,
        AuditProto.AuditProtoClient auditClient,
        ILogger<AuditInterceptor> logger)
    {
        _httpContextAccessor = httpContextAccessor;
        _auditClient = auditClient;
        _logger = logger;
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context == null)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var httpContext = _httpContextAccessor.HttpContext;

        var entries = eventData.Context.ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
            .ToList();

        if (entries.Count == 0)
            return await base.SavingChangesAsync(eventData, result, cancellationToken);

        var contextualAction = httpContext?.Items["AuditAction"]?.ToString();
        var action = contextualAction ?? InferAction(entries);

        // Build grouped OldValues and NewValues
        var oldValuesGroup = new Dictionary<string, List<Dictionary<string, object?>>>();
        var newValuesGroup = new Dictionary<string, List<Dictionary<string, object?>>>();

        foreach (var entry in entries)
        {
            var entityName = entry.Entity.GetType().Name;

            switch (entry.State)
            {
                case EntityState.Added:
                    AddToGroup(newValuesGroup, entityName, SerializeEntryValues(entry.CurrentValues));
                    break;
                case EntityState.Modified:
                    AddToGroup(oldValuesGroup, entityName, SerializeModifiedOriginal(entry));
                    AddToGroup(newValuesGroup, entityName, SerializeModifiedCurrent(entry));
                    break;
                case EntityState.Deleted:
                    AddToGroup(oldValuesGroup, entityName, SerializeEntryValues(entry.OriginalValues));
                    break;
            }
        }

        var controllerName = GetControllerName(httpContext) ?? entries.First().Entity.GetType().Name;

        var request = new WriteAuditLogRequest
        {
            UserId = httpContext?.User?.Claims.FirstOrDefault(c => c.Type == "name")?.Value ?? "",
            UserName = httpContext?.User?.Claims.FirstOrDefault(c => c.Type == "username")?.Value ?? "System",
            Action = action,
            EntityName = controllerName,
            EntityId = GetEntityId(entries.First()),
            OldValues = oldValuesGroup.Count > 0 ? JsonSerializer.Serialize(oldValuesGroup) : "",
            NewValues = newValuesGroup.Count > 0 ? JsonSerializer.Serialize(newValuesGroup) : "",
            IpAddress = GetIpAddress(httpContext),
            ServiceName = "CatalogService",
            IsSuccess = true,
            ErrorMessage = ""
        };

        _ = Task.Run(async () =>
        {
            try { await _auditClient.WriteAuditLogAsync(request); }
            catch (Exception ex) { _logger.LogWarning(ex, "Failed to send audit log"); }
        }, cancellationToken);

        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static string InferAction(List<EntityEntry> entries)
    {
        var states = entries.Select(e => e.State).Distinct().ToList();
        if (states.Count == 1)
        {
            return states[0] switch
            {
                EntityState.Added => "CREATE",
                EntityState.Modified => "UPDATE",
                EntityState.Deleted => "DELETE",
                _ => "UNKNOWN"
            };
        }
        return "UPDATE";
    }

    private static string? GetControllerName(HttpContext? httpContext)
    {
        if (httpContext == null) return null;
        var segments = httpContext.Request.Path.Value?.Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments != null && segments.Length >= 2)
            return segments[1];
        return null;
    }

    private static void AddToGroup(Dictionary<string, List<Dictionary<string, object?>>> group, string entityName, Dictionary<string, object?> values)
    {
        if (values.Count == 0) return;
        if (!group.ContainsKey(entityName))
            group[entityName] = new List<Dictionary<string, object?>>();
        group[entityName].Add(values);
    }

    private static string GetEntityId(EntityEntry entry)
    {
        var keys = entry.Metadata.FindPrimaryKey()?.Properties;
        if (keys == null) return "";
        return string.Join(",", keys.Select(p => entry.Property(p.Name).CurrentValue?.ToString() ?? ""));
    }

    private static string GetIpAddress(HttpContext? ctx)
    {
        if (ctx == null) return "";
        var fwd = ctx.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(fwd)) return fwd.Split(',').FirstOrDefault()?.Trim() ?? "";
        return ctx.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "";
    }

    private static Dictionary<string, object?> SerializeEntryValues(PropertyValues values)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var p in values.Properties)
        {
            if (ExcludedProperties.Contains(p.Name)) continue;
            dict[p.Name] = values[p];
        }
        return dict;
    }

    private static Dictionary<string, object?> SerializeModifiedOriginal(EntityEntry entry)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var p in entry.Properties.Where(p => p.IsModified))
        {
            if (ExcludedProperties.Contains(p.Metadata.Name)) continue;
            dict[p.Metadata.Name] = p.OriginalValue;
        }
        return dict;
    }

    private static Dictionary<string, object?> SerializeModifiedCurrent(EntityEntry entry)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var p in entry.Properties.Where(p => p.IsModified))
        {
            if (ExcludedProperties.Contains(p.Metadata.Name)) continue;
            dict[p.Metadata.Name] = p.CurrentValue;
        }
        return dict;
    }
}
