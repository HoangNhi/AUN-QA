using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Background;
using AUN_QA.BusinessService.Services.Commons.Email;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.Survey
{
    [RegisterClassAsTransient]
    public class SurveyCampaignService : ISurveyCampaignService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;
        private readonly ICatalogIntegrationService _catalogService;
        private readonly IBackgroundTaskQueue _taskQueue;

        public SurveyCampaignService(
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

        public async Task<ModelSurveyCampaign> GetById(GetByIdRequest request)
        {
            var data = await _context.SurveyCampaigns.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelSurveyCampaign>(data);

            return result;
        }

        public async Task<ModelSurveyCampaign> Insert(SurveyCampaignRequest request)
        {
            var data = _context.SurveyCampaigns.Where(x =>
                x.CycleId == request.CycleId && x.StakeholderType == request.StakeholderType
                && !x.IsDeleted
            );

            if (await data.AnyAsync())
            {
                throw new Exception("Khảo sát cho đối tượng này đã tồn tại ở quy trình này");
            }

            var add = _mapper.Map<Entities.SurveyCampaign>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.Now;
            await _context.SurveyCampaigns.AddAsync(add);

            await _context.SaveChangesAsync();
            return _mapper.Map<ModelSurveyCampaign>(add);
        }

        public async Task<ModelSurveyCampaign> Update(SurveyCampaignRequest request)
        {
            var data = _context.SurveyCampaigns.Where(x =>
               x.CycleId == request.CycleId && x.StakeholderType == request.StakeholderType
                && !x.IsDeleted && x.Id != request.Id);

            if (await data.AnyAsync())
            {
                throw new Exception("Khảo sát cho đối tượng này đã tồn tại ở quy trình này");
            }

            var update = await _context.SurveyCampaigns.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            update.UpdatedAt = DateTime.Now;

            _context.SurveyCampaigns.Update(update);
            await _context.SaveChangesAsync();

            return _mapper.Map<ModelSurveyCampaign>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.SurveyCampaigns.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;

                _context.SurveyCampaigns.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> GetList(SurveyCampaignGetListPagingRequest request)
        {
            var query = _context.SurveyCampaigns
                .Where(x => !x.IsDeleted);

            if (request.StakeholderType.HasValue)
            {
                query = query.Where(x => x.StakeholderType == request.StakeholderType);
            }

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.Name.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ProjectTo<ModelSurveyCampaignGetListPaging>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new GetListPagingResponse<ModelSurveyCampaignGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox()
        {
            var data = await _context.SurveyCampaigns.Where(x => !x.IsDeleted && x.IsActived == true).ToListAsync();
            return data.Select(x => new ModelCombobox
            {
                Text = x.Name,
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
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
