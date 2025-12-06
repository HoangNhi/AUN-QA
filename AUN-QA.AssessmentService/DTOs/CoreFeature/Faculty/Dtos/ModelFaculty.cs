using AUN_QA.AssessmentService.DTOs.Base;

namespace AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Dtos
{
    public class ModelFaculty : BaseModel
    {
        public Guid Id { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public string? Description { get; set; }
    }
}
