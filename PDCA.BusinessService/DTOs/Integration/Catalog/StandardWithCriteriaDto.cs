namespace AUN_QA.BusinessService.DTOs.Integration.Catalog
{
    public class StandardWithCriteriaDto
    {
        public Guid StandardId { get; set; }

        public string StandardCode { get; set; } = null!;

        public string StandardName { get; set; } = null!;

        public int StandardOrder { get; set; }

        public Guid CriterionId { get; set; }

        public string CriterionCode { get; set; } = null!;

        public string CriterionName { get; set; } = null!;

        public bool IsPrerequisite { get; set; }

        public int CriterionOrder { get; set; }
    }
}
