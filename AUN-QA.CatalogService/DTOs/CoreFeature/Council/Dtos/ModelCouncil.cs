namespace AUN_QA.CatalogService.DTOs.CoreFeature.Council
{
    public class ModelCouncil
    {
        public Guid Id { get; set; }
        public Guid CycleId { get; set; }
        public Guid UserId { get; set; }
        public bool IsLeader { get; set; }
    }
}
