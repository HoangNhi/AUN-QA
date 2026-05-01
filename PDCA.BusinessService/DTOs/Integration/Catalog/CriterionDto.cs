namespace AUN_QA.BusinessService.DTOs.Integration.Catalog
{
    public class CriterionDto
    {
        public Guid Id { get; set; }

        public Guid StandardId { get; set; }

        public string Code { get; set; } = null!;

        public string Name { get; set; } = null!;

        public bool IsPrerequisite { get; set; }

        public string? DiagnosticQuestions { get; set; }

        public string? Description { get; set; }

        public int Order { get; set; }
    }
}
