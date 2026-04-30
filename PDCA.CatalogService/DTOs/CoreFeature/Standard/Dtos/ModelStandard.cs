using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Standard.Dtos
{
    public class ModelStandard : BaseModel
    {
        public Guid Id { get; set; }

        public Guid StandardSetId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int Order { get; set; }
    }
}
