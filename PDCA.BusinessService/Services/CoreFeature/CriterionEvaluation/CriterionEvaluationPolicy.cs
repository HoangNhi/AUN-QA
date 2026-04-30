using System.Text.Json;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.Entities;

namespace AUN_QA.BusinessService.Services.CoreFeature.CriterionEvaluation
{
    public static class CriterionEvaluationPolicy
    {
        public const int EvaluationModeAun = 1;
        public const int EvaluationModeMoet = 2;

        public static bool CanTvhSubmit(
            Guid cycleId,
            Guid currentUserId,
            Guid standardId,
            IEnumerable<Council> councils)
        {
            return councils.Any(c =>
                c.CycleId == cycleId &&
                c.UserId == currentUserId &&
                c.RoleId == (int)CouncilRole.Evaluator &&
                c.IsActived &&
                !c.IsDeleted &&
                AssignedStandardsContains(c.AssignedStandards, standardId));
        }

        public static bool AssignedStandardsContains(string? assignedStandardsJson, Guid standardId)
        {
            if (string.IsNullOrWhiteSpace(assignedStandardsJson))
                return false;

            try
            {
                var ids = JsonSerializer.Deserialize<List<Guid>>(assignedStandardsJson);
                return ids?.Contains(standardId) == true;
            }
            catch
            {
                return false;
            }
        }

        public static int? CalculateRoundedAunScore(IEnumerable<int?> officialScores)
        {
            var approvedScores = officialScores
                .Where(score => score.HasValue)
                .Select(score => (double)score!.Value)
                .ToList();

            if (!approvedScores.Any())
                return null;

            return (int)Math.Round(approvedScores.Average(), MidpointRounding.AwayFromZero);
        }
    }
}
