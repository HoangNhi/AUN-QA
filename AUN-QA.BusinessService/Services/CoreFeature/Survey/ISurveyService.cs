namespace AUN_QA.BusinessService.Services.CoreFeature.Survey
{
    public interface ISurveyService
    {
        Task<string> SendSurvey(int? type);
    }
}
