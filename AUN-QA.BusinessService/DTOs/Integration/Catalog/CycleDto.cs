namespace AUN_QA.BusinessService.DTOs.Integration.Catalog
{
    public class CycleDto
    {
        public Guid Id { get; set; }

        public string Name { get; set; } = null!;

        public int Year { get; set; }

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public int Status { get; set; }

        public string EvaluationPurpose { get; set; } = null!;

        public int Scope { get; set; }
    }
}
