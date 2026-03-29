using AUN_QA.Shared.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Dtos
{
    public class ModelFaculty : BaseModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public bool? IsActived { get; set; } 
    }
}
