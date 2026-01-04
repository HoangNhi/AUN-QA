using AUN_QA.BusinessService.Infrastructure.Data;
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

        public SurveyService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
        }

        public async Task<string> SendSurvey(int? type)
        {
            // Sử dụng cực kỳ tự nhiên với C#
            await foreach (var stakeholder in _catalogService.GetStakeholdersStreamAsync(type))
            {
                // stakeholder ở đây là StakeholderDto thuần, không phải Proto object
                Console.WriteLine($"Sending to: {stakeholder.Email}");
            }

            return "ok";
        }
    }
}
