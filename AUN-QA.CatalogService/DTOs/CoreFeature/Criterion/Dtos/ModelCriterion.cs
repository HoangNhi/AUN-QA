using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Criterion.Dtos
{
    public class ModelCriterion : BaseModel
    {
        public Guid Id { get; set; }
        public Guid StandardId { get; set; }
        public string StandardName { get; set; } = null!;
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Guidance { get; set; } = null!;
    }
}
