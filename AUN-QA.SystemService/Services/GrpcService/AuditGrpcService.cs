using AUN_QA.SystemService.Entities;
using AUN_QA.SystemService.Infrastructure.Data;
using AUN_QA.SystemService.Protos;
using Grpc.Core;

namespace AUN_QA.SystemService.Services.GrpcService;

public class AuditGrpcService : AuditProto.AuditProtoBase
{
    private readonly SystemContext _context;
    private readonly ILogger<AuditGrpcService> _logger;

    public AuditGrpcService(SystemContext context, ILogger<AuditGrpcService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override async Task<WriteAuditLogReply> WriteAuditLog(
        WriteAuditLogRequest request, ServerCallContext context)
    {
        try
        {
            var auditLog = new AuditLog
            {
                Id = Guid.NewGuid(),
                UserId = Guid.TryParse(request.UserId, out var uid) ? uid : Guid.Empty,
                UserName = request.UserName,
                Action = request.Action,
                EntityName = request.EntityName,
                EntityId = string.IsNullOrEmpty(request.EntityId) ? null : request.EntityId,
                OldValues = string.IsNullOrEmpty(request.OldValues) ? null : request.OldValues,
                NewValues = string.IsNullOrEmpty(request.NewValues) ? null : request.NewValues,
                IpAddress = request.IpAddress,
                ServiceName = request.ServiceName,
                IsSuccess = request.IsSuccess,
                ErrorMessage = string.IsNullOrEmpty(request.ErrorMessage) ? null : request.ErrorMessage,
                CreatedAt = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);
            await _context.SaveChangesAsync();

            return new WriteAuditLogReply { Success = true, Message = "OK" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to write audit log from {ServiceName}", request.ServiceName);
            return new WriteAuditLogReply { Success = false, Message = ex.Message };
        }
    }
}
