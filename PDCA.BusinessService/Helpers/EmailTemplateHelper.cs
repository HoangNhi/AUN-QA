using System;
using System.IO;
using System.Reflection;
using AUN_QA.Shared.Common;

namespace AUN_QA.BusinessService.Helpers
{
    public static class EmailTemplateHelper
    {
        public static string GetSurveyInvitationBody(string stakeholderName, string campaignName, string surveyLink)
        {
            var templatePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Templates", "Email", "SurveyInvitation.html");
            
            if (!File.Exists(templatePath))
            {
                // Fallback if template is not found, although this should be covered by proper deployment
                return $@"
                    <h3>Kính chào {stakeholderName},</h3>
                    <p>Bạn được mời tham gia khảo sát: <strong>{campaignName}</strong>.</p>
                    <p>Vui lòng nhấp vào liên kết dưới đây để thực hiện khảo sát:</p>
                    <p><a href='{surveyLink}'>{surveyLink}</a></p>
                    <p>Trân trọng,<br/>PDCA System</p>
                ";
            }

            string body = File.ReadAllText(templatePath);
            body = body.Replace("{{StakeholderName}}", stakeholderName)
                       .Replace("{{CampaignName}}", campaignName)
                       .Replace("{{SurveyLink}}", surveyLink)
                       .Replace("{{CurrentYear}}", DateTimeHelper.VietnamNow.Year.ToString());

            return body;
        }
    }
}
