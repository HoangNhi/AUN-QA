namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class PersistSarSnapshotFromCollabRequest
    {
        public Guid CycleId { get; set; }

        public string? YDocSnapshotBase64 { get; set; }
    }
}
