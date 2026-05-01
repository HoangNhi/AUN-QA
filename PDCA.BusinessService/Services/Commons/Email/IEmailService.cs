namespace AUN_QA.BusinessService.Services.Commons.Email
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body);
    }
}
