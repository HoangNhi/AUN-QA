using AUN_QA.SystemService.DTOs.Base;

namespace AUN_QA.SystemService.DTOs.CoreFeature.User.Dtos
{
    public class ModelUser : BaseModel
    {
        public Guid Id { get; set; }

        public string Username { get; set; } = null!;

        public string Fullname { get; set; } = null!;

        public string Password { get; set; } = null!;

        public Guid RoleId { get; set; }
    }
}
