using System;
using AUN_QA.CatalogService.DTOs.Base;

namespace AUN_QA.CatalogService.DTOs.CoreFeature.Cycle.Dtos
{
    public class ModelCycle : BaseModel
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public int Year { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = null!;
        public string EvaluationPurpose { get; set; } = null!;
        public int Scope { get; set; }
    }
}
