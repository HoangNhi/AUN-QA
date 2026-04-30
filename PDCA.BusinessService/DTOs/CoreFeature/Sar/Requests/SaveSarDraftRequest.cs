namespace AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Requests
{
    public class SaveSarDraftRequest
    {
        public Guid CycleId { get; set; }

        public string? YDocSnapshotBase64 { get; set; }

        public string? RenderedHtml { get; set; }
    }
}
