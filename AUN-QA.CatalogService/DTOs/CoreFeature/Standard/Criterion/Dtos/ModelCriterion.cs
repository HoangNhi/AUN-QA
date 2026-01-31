using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Criterion.Dtos
{
    public class ModelCriterion : BaseModel
    {
        public Guid Id { get; set; }

        public Guid StandardId { get; set; }

        public Guid FileTypeId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int Order { get; set; }
    }
}
