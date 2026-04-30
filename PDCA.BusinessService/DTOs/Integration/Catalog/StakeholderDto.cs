namespace AUN_QA.BusinessService.DTOs.Integration.Catalog
{
    public class StakeholderDto
    {
        public Guid Id { get; set; }

        public string FullName { get; set; } = null!;

        public string Email { get; set; } = null!;

        public int Type { get; set; }

        public string? Description { get; set; }
    }
}
