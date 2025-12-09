using AUN_QA.IdentityService.DTOs.Base;

namespace AUN_QA.IdentityService.DTOs.CoreFeature.SystemGroup.Dtos
{
    public class ModelSystemGroup : BaseModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public new int Sort { get; set; }

        public Guid? ParentId { get; set; }
    }
}
