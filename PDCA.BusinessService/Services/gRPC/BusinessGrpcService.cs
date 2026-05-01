using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Protos;
using Grpc.Core;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.gRPC
{
    public class BusinessGrpcService : BusinessProto.BusinessProtoBase
    {
        private const int StatusInProgress = 1;

        private readonly BusinessContext _context;

        public BusinessGrpcService(BusinessContext context)
        {
            _context = context;
        }

        public override async Task<CheckExternalReviewerAccessResponse> CheckExternalReviewerAccess(
            CheckExternalReviewerAccessRequest request,
            ServerCallContext context)
        {
            if (!Guid.TryParse(request.UserId, out var userId))
            {
                return new CheckExternalReviewerAccessResponse { HasAccess = false };
            }

            var hasAccess = await _context.ExternalReviewAccounts
                .AsNoTracking()
                .AnyAsync(a =>
                    a.UserId == userId
                    && !a.ExternalReview.IsDeleted
                    && a.ExternalReview.IsActived
                    && a.ExternalReview.Status == StatusInProgress
                    && !a.ExternalReview.IsCompleted);

            return new CheckExternalReviewerAccessResponse { HasAccess = hasAccess };
        }
    }
}
