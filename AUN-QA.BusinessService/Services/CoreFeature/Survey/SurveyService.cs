using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Background;
using AUN_QA.BusinessService.Services.Commons.Email;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.Survey
{
    [RegisterClassAsTransient]
    public class SurveyService : ISurveyService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICatalogIntegrationService _catalogService;
        private readonly IBackgroundTaskQueue _taskQueue;

        public SurveyService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService,
            IBackgroundTaskQueue taskQueue)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
            _taskQueue = taskQueue;
        }

        public async Task<string> SendSurvey(int? type)
        {
            int count = 0;

            // 1. Lấy dòng chảy dữ liệu từ Catalog (Streaming)
            // Code này không bao giờ load toàn bộ list vào RAM
            await foreach (var stakeholder in _catalogService.GetStakeholdersStreamAsync(type))
            {
                // 2. Đẩy vào hàng đợi xử lý ngầm
                await _taskQueue.QueueBackgroundWorkItemAsync(async (serviceProvider, token) =>
                {
                    // Lấy EmailService từ Scope riêng của Background Worker
                    var emailService = serviceProvider.GetRequiredService<IEmailService>();

                    string body = $"Name: {stakeholder.FullName}\nEmail: {stakeholder.Email}\nDecription: {stakeholder.Description}";
                    await emailService.SendEmailAsync(stakeholder.Email, "Test gửi email", body);
                });

                count++;
            }

            return $"Đã đẩy {count} email vào hàng đợi gửi đi.";
        }
    }
}
