using AUN_QA.CatalogService.Infrastructure.Data;
using AUN_QA.CatalogService.Protos;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.CatalogService.Services.gRPC
{
    public class CatalogGrpcService : CatalogProto.CatalogProtoBase
    {
        private readonly CatalogContext _context;

        public CatalogGrpcService(CatalogContext context)
        {
            _context = context;
        }

        public override async Task GetStakeholdersStream(
            GetStakeholdersStreamRequest request,
            IServerStreamWriter<StakeholderMinimalInfo> responseStream,
            ServerCallContext context)
        {
            // 1. Tạo IQueryable (Lazy evaluation)
            var query = _context.Stakeholders.AsNoTracking();

            // 2. Apply Filters
            if (request.StakeholderType != null)
            {
                // Giả sử logic map type ở đây
                query = query.Where(s => s.Type == request.StakeholderType.Value);
            }

            // 3. Projection: Chỉ select cột cần thiết ngay từ câu SQL
            var dataStream = query
                .Where(x => x.IsActived && !x.IsDeleted)
                .Select(s => new StakeholderMinimalInfo
                {
                    Id = s.Id.ToString(),
                    FullName = s.FullName,
                    Email = s.Email,
                    Type = s.Type,
                    Description = s.Description
                });

            // 4. Streaming Loop
            // EF Core sẽ giữ kết nối DB mở và đọc từng dòng (hoặc từng batch nhỏ)
            foreach (var item in dataStream)
            {
                if (context.CancellationToken.IsCancellationRequested)
                {
                    break;
                }

                await responseStream.WriteAsync(item);
            }

        }
    }
}
