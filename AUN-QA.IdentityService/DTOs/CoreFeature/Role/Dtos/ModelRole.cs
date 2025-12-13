using AUN_QA.IdentityService.DTOs.Base;

namespace AUN_QA.IdentityService.DTOs.CoreFeature.Role.Dtos
{
    public class ModelRole : BaseModel
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;
    }
}
