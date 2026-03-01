using AUN_QA.SystemService.Entities;
using AUN_QA.SystemService.Infrastructure.Data;

namespace AUN_QA.SystemService.Infrastructure.Services;

public class AuditLogWriter : IAuditLogWriter
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<AuditLogWriter> _logger;

    public AuditLogWriter(IServiceScopeFactory scopeFactory, ILogger<AuditLogWriter> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task WriteAsync(AuditLog auditLog)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<SystemContext>();
            context.AuditLogs.Add(auditLog);
            await context.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log for {Action} on {Entity}",
                auditLog.Action, auditLog.EntityName);
        }
    }
}
