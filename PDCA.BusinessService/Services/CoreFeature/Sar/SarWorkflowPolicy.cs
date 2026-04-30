using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Entities;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar
{
    public static class SarWorkflowPolicy
    {
        public static bool CanSaveDraft(int currentStatus)
        {
            return currentStatus is (int)SarStatus.Draft or (int)SarStatus.RevisionRequested;
        }

        public static bool CanSubmit(int currentStatus)
        {
            return currentStatus is (int)SarStatus.Draft or (int)SarStatus.RevisionRequested;
        }

        public static bool CanRequestRevision(int currentStatus)
        {
            return currentStatus == (int)SarStatus.Submitted;
        }

        public static bool CanApprove(int currentStatus)
        {
            return currentStatus == (int)SarStatus.Submitted;
        }

        public static bool CanApprove(Council council)
        {
            if (council.RoleId == (int)CouncilRole.HeadOfCouncil)
            {
                return true;
            }

            if (council.RoleId != (int)CouncilRole.ViceChairman)
            {
                return false;
            }

            return IsDelegationActive(council);
        }

        public static bool HasValidEvaluatorScope(string? assignedStandardsJson)
        {
            if (string.IsNullOrWhiteSpace(assignedStandardsJson))
            {
                return false;
            }

            try
            {
                var assignedStandards = JsonSerializer.Deserialize<List<Guid>>(assignedStandardsJson);
                return assignedStandards is { Count: > 0 };
            }
            catch
            {
                return false;
            }
        }

        public static bool IsDelegationActive(Council council)
        {
            if (!council.IsDelegated)
            {
                return false;
            }

            if (council.DelegatedUntil.HasValue && council.DelegatedUntil.Value <= DateTime.UtcNow)
            {
                return false;
            }

            return true;
        }
    }
}
