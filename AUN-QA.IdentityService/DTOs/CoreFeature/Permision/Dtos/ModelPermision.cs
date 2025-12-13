namespace AUN_QA.IdentityService.DTOs.CoreFeature.Permision.Dtos
{
    public class ModelPermision
    {
        public string SystemGroup { get; set; } = string.Empty;
        public List<ModelPermision_Menu> Roles { get; set; } = new List<ModelPermision_Menu>();

    }
}
