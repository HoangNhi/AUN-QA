namespace AUN_QA.AssessmentService.DTOs.Base
{
    public class BaseRequests
    {
        public bool IsActived { get; set; } = true;
        public bool IsEdit { get; set; } = false;
        public int? Sort { get; set; } = 0;
    }
}
