using AUN_QA.IdentityService.DTOs.Base;

namespace AUN_QA.IdentityService.DTOs.CoreFeature.User.Dtos
{
    public class ModelUser : BaseModel
    {
        public Guid Id { get; set; }

        public string Username { get; set; } = null!;

        public string Fullname { get; set; } = null!;

        public string Password { get; set; } = null!;
    }
}
