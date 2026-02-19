namespace AUN_QA.BusinessService.DTOs.CoreFeature.EvidenceCycleMap.Responses
{
    public class EvidenceSummary
    {
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class VerifiedFileTypeCountResponse
    {
        public Guid FileTypeId { get; set; }
        public int Count { get; set; }
        public List<EvidenceSummary> Evidences { get; set; } = [];
    }
}
