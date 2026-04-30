using AutoDependencyRegistration.Attributes;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace AUN_QA.BusinessService.Services.Commons.Email
{
    [RegisterClassAsTransient]
    public class SmtpEmailService : IEmailService
    {
        private readonly EmailSettings _settings;

        public SmtpEmailService(IOptions<EmailSettings> settings)
        {
            _settings = settings.Value;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.DisplayName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = _settings.EnableSsl
            };

            await client.SendMailAsync(message);
        }
    }
}
