using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using AUN_QA.BusinessService.DTOs.Integration.Catalog;
using AUN_QA.BusinessService.Helpers;
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
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public SurveyCampaignService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService,
            IBackgroundTaskQueue taskQueue,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
            _taskQueue = taskQueue;
            _emailService = emailService;
            _configuration = configuration;
        }

        #region SurveyCampaign
        public async Task<SurveyCampaignRequest> GetById(GetByIdRequest request)
        {
            var data = await _context.SurveyCampaigns.AsNoTracking().FirstOrDefaultAsync(x => x.Id == request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            //await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));

            var result = _mapper.Map<SurveyCampaignRequest>(data);

            #region Chủ đề khảo sát và nhóm câu hỏi
            // 1. Get raw data
            var topics = await _context.TemplateTopics
                .AsNoTracking()
                .Where(x => x.CampaignId == result.Id && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var topicIds = topics.Select(x => x.Id).ToList();

            var categories = await _context.TemplateCategories
                .AsNoTracking()
                .Where(x => topicIds.Contains(x.TopicId) && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var categoryIds = categories.Select(x => x.Id).ToList();

            var questions = await _context.TemplateQuestions
                .AsNoTracking()
                .Where(x => categoryIds.Contains(x.CategoryId) && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var textQuestions = await _context.TemplateTextQuestions
                .AsNoTracking()
                .Where(x => topicIds.Contains(x.TopicId) && !x.IsDeleted)
                .ToListAsync();

            // 2. Map to DTOs
            var topicDtos = _mapper.Map<List<TemplateTopicRequest>>(topics);
            var categoryDtos = _mapper.Map<List<TemplateCategoryRequest>>(categories);
            var questionDtos = _mapper.Map<List<TemplateQuestionRequest>>(questions);
            var textQuestionDtos = _mapper.Map<List<TemplateTextQuestionRequest>>(textQuestions);

            // 3. Assemble hierarchy
            foreach (var topic in topicDtos)
            {
                topic.ListCategory = categoryDtos.Where(x => x.TopicId == topic.Id).ToList();
                topic.ListTextQuestion = textQuestionDtos.Where(x => x.TopicId == topic.Id).ToList();

                foreach (var category in topic.ListCategory)
                {
                    category.ListQuestion = questionDtos.Where(x => x.CategoryId == category.Id).ToList();
                }
            }

            result.ListTopic = topicDtos;
            #endregion

            #region Người tham gia
            var stakeholderDtos = await _context.SurveySessions
                .AsNoTracking()
                .Where(x => x.CampaignId == result.Id && !x.IsDeleted)
                .OrderBy(x => x.StakeholderName)
                .ToListAsync();
            #endregion

            return result;
        }

        public async Task Insert(SurveyCampaignRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
            await CheckCycleStageAsync(request.CycleId.ToString());
            await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            var data = _context.SurveyCampaigns.Where(x =>
                x.CycleId == request.CycleId && x.StakeholderType == request.StakeholderType
                && !x.IsDeleted
            );

            if (await data.AnyAsync())
            {
                throw new Exception("Khảo sát cho đối tượng này đã tồn tại ở chu kỳ này");
            }

            var add = _mapper.Map<Entities.SurveyCampaign>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.Status = ((int)SurveyCampaignStatus.Draft);
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.Now;
            await _context.SurveyCampaigns.AddAsync(add);

            #region Chủ đề khảo sát và nhóm câu hỏi
            if (!request.ListTopic.Any())
            {
                throw new Exception("Khảo sát phải có ít nhất một chủ đề khảo sát");
            }

            foreach (var topicReq in request.ListTopic)
            {
                var addTopic = _mapper.Map<Entities.TemplateTopic>(topicReq);
                addTopic.Id = Guid.NewGuid();
                addTopic.CampaignId = add.Id;
                addTopic.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                addTopic.CreatedAt = DateTime.Now;
                await _context.TemplateTopics.AddAsync(addTopic);

                if (!topicReq.ListCategory.Any())
                {
                    throw new Exception($"Chủ đề '{topicReq.Title}' phải có ít nhất một nhóm câu hỏi");
                }

                foreach (var catReq in topicReq.ListCategory)
                {
                    var addcategory = _mapper.Map<Entities.TemplateCategory>(catReq);
                    addcategory.Id = Guid.NewGuid();
                    addcategory.TopicId = addTopic.Id;
                    addcategory.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addcategory.CreatedAt = DateTime.Now;
                    await _context.TemplateCategories.AddAsync(addcategory);

                    if (!catReq.ListQuestion.Any())
                    {
                        throw new Exception($"Nhóm câu hỏi '{catReq.Name}' phải có ít nhất một câu hỏi");
                    }

                    foreach (var question in catReq.ListQuestion)
                    {
                        var addQuestion = _mapper.Map<Entities.TemplateQuestion>(question);
                        addQuestion.Id = Guid.NewGuid();
                        addQuestion.CategoryId = addcategory.Id;
                        addQuestion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        addQuestion.CreatedAt = DateTime.Now;
                        await _context.TemplateQuestions.AddAsync(addQuestion);
                    }
                }

                if (topicReq.HasTextQuestionPart && !topicReq.ListTextQuestion.Any())
                {
                    throw new Exception($"Phần ý kiến khác của chủ đề '{topicReq.Title}' phải có ít nhất một câu hỏi");
                }

                foreach (var textQuestion in topicReq.ListTextQuestion)
                {
                    var addTextQuestion = _mapper.Map<Entities.TemplateTextQuestion>(textQuestion);
                    addTextQuestion.Id = Guid.NewGuid();
                    addTextQuestion.TopicId = addTopic.Id;
                    addTextQuestion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addTextQuestion.CreatedAt = DateTime.Now;
                    await _context.TemplateTextQuestions.AddAsync(addTextQuestion);
                }
            }
            #endregion
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task Update(SurveyCampaignRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
            await CheckCycleStageAsync(request.CycleId.ToString());
            await CheckPdcaPermissionAsync(request.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));
            var data = _context.SurveyCampaigns.Where(x =>
               x.CycleId == request.CycleId && x.StakeholderType == request.StakeholderType
                && !x.IsDeleted && x.Id != request.Id);

            if (await data.AnyAsync())
            {
                throw new Exception("Khảo sát cho đối tượng này đã tồn tại ở chu kỳ này");
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

            #region Chủ đề khảo sát và nhóm câu hỏi
            // 1. Fetch existing data
            var existingTopics = await _context.TemplateTopics
                .Where(x => x.CampaignId == update.Id && !x.IsDeleted)
                .ToListAsync();
            var existingTopicIds = existingTopics.Select(x => x.Id).ToList();

            var existingCategories = await _context.TemplateCategories
                .Where(x => existingTopicIds.Contains(x.TopicId) && !x.IsDeleted)
                .ToListAsync();
            var existingCategoryIds = existingCategories.Select(x => x.Id).ToList();

            var existingQuestions = await _context.TemplateQuestions
                .Where(x => existingCategoryIds.Contains(x.CategoryId) && !x.IsDeleted)
                .ToListAsync();

            var existingTextQuestions = await _context.TemplateTextQuestions
                .Where(x => existingTopicIds.Contains(x.TopicId) && !x.IsDeleted)
                .ToListAsync();

            await ValidateChildIdsBelongToCampaignAsync(
                request,
                update.Id,
                existingTopics,
                existingCategories,
                existingQuestions,
                existingTextQuestions);

            // 2. Process Request Data
            if (!request.ListTopic.Any())
            {
                throw new Exception("Khảo sát phải có ít nhất một chủ đề khảo sát");
            }

            foreach (var topicReq in request.ListTopic)
            {
                Entities.TemplateTopic currentTopic;
                var existingTopic = existingTopics.FirstOrDefault(x => x.Id == topicReq.Id);

                if (existingTopic != null)
                {
                    // Update Topic
                    _mapper.Map(topicReq, existingTopic);
                    existingTopic.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    existingTopic.UpdatedAt = DateTime.Now;
                    _context.TemplateTopics.Update(existingTopic);
                    currentTopic = existingTopic;

                    // Remove from list to track deletion later
                    existingTopics.Remove(existingTopic);
                }
                else
                {
                    // Add Topic
                    var newTopic = _mapper.Map<Entities.TemplateTopic>(topicReq);
                    newTopic.Id = Guid.NewGuid();
                    newTopic.CampaignId = update.Id;
                    newTopic.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    newTopic.CreatedAt = DateTime.Now;
                    await _context.TemplateTopics.AddAsync(newTopic);
                    currentTopic = newTopic;
                }

                if (!topicReq.ListCategory.Any())
                {
                    throw new Exception($"Chủ đề '{topicReq.Title}' phải có ít nhất một nhóm câu hỏi");
                }

                foreach (var catReq in topicReq.ListCategory)
                {
                    Entities.TemplateCategory currentCategory;
                    var existingCategory = existingCategories.FirstOrDefault(x => x.Id == catReq.Id);

                    if (existingCategory != null)
                    {
                        // Update Category
                        _mapper.Map(catReq, existingCategory);
                        existingCategory.TopicId = currentTopic.Id; // Ensure link
                        existingCategory.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        existingCategory.UpdatedAt = DateTime.Now;
                        _context.TemplateCategories.Update(existingCategory);
                        currentCategory = existingCategory;

                        existingCategories.Remove(existingCategory);
                    }
                    else
                    {
                        // Add Category
                        var newCategory = _mapper.Map<Entities.TemplateCategory>(catReq);
                        newCategory.Id = Guid.NewGuid();
                        newCategory.TopicId = currentTopic.Id;
                        newCategory.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        newCategory.CreatedAt = DateTime.Now;
                        await _context.TemplateCategories.AddAsync(newCategory);
                        currentCategory = newCategory;
                    }

                    if (!catReq.ListQuestion.Any())
                    {
                        throw new Exception($"Nhóm câu hỏi '{catReq.Name}' phải có ít nhất một câu hỏi");
                    }

                    foreach (var qReq in catReq.ListQuestion)
                    {
                        var existingQuestion = existingQuestions.FirstOrDefault(x => x.Id == qReq.Id);

                        if (existingQuestion != null)
                        {
                            // Update Question
                            _mapper.Map(qReq, existingQuestion);
                            existingQuestion.CategoryId = currentCategory.Id;
                            existingQuestion.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                            existingQuestion.UpdatedAt = DateTime.Now;
                            _context.TemplateQuestions.Update(existingQuestion);

                            existingQuestions.Remove(existingQuestion);
                        }
                        else
                        {
                            // Add Question
                            var newQuestion = _mapper.Map<Entities.TemplateQuestion>(qReq);
                            newQuestion.Id = Guid.NewGuid();
                            newQuestion.CategoryId = currentCategory.Id;
                            newQuestion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                            newQuestion.CreatedAt = DateTime.Now;
                            await _context.TemplateQuestions.AddAsync(newQuestion);
                        }
                    }
                }

                if (topicReq.HasTextQuestionPart && !topicReq.ListTextQuestion.Any())
                {
                    throw new Exception($"Phần ý kiến khác của chủ đề '{topicReq.Title}' phải có ít nhất một câu hỏi");
                }

                foreach (var txtReq in topicReq.ListTextQuestion)
                {
                    var existingTextQ = existingTextQuestions.FirstOrDefault(x => x.Id == txtReq.Id);

                    if (existingTextQ != null)
                    {
                        // Update Text Question
                        _mapper.Map(txtReq, existingTextQ);
                        existingTextQ.TopicId = currentTopic.Id;
                        existingTextQ.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        existingTextQ.UpdatedAt = DateTime.Now;
                        _context.TemplateTextQuestions.Update(existingTextQ);

                        existingTextQuestions.Remove(existingTextQ);
                    }
                    else
                    {
                        // Add Text Question
                        var newTextQ = _mapper.Map<Entities.TemplateTextQuestion>(txtReq);
                        newTextQ.Id = Guid.NewGuid();
                        newTextQ.TopicId = currentTopic.Id;
                        newTextQ.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        newTextQ.CreatedAt = DateTime.Now;
                        await _context.TemplateTextQuestions.AddAsync(newTextQ);
                    }
                }
            }

            foreach (var q in existingQuestions)
            {
                q.IsDeleted = true;
                q.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                q.UpdatedAt = DateTime.Now;
                _context.TemplateQuestions.Update(q);
            }

            foreach (var c in existingCategories)
            {
                c.IsDeleted = true;
                c.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                c.UpdatedAt = DateTime.Now;
                _context.TemplateCategories.Update(c);
            }

            foreach (var tq in existingTextQuestions)
            {
                tq.IsDeleted = true;
                tq.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                tq.UpdatedAt = DateTime.Now;
                _context.TemplateTextQuestions.Update(tq);
            }

            foreach (var t in existingTopics)
            {
                t.IsDeleted = true;
                t.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                t.UpdatedAt = DateTime.Now;
                _context.TemplateTopics.Update(t);
            }
            #endregion

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.SurveyCampaigns.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                await CheckCycleStageAsync(delete.CycleId.ToString());
                await CheckPdcaPermissionAsync(delete.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                delete.UpdatedAt = DateTime.Now;

                _context.SurveyCampaigns.Update(delete);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> GetList(SurveyCampaignGetListPagingRequest request)
        {
            var cycles = await _catalogService.GetCyclesStreamAsync(new CatalogService.Protos.GetCyclesStreamRequest()).ToListAsync();
            var activeCycleIds = cycles.Select(c => c.Id).ToList();

            var query = _context.SurveyCampaigns
                .Where(x => !x.IsDeleted && activeCycleIds.Contains(x.CycleId));

            if (request.StakeholderType.HasValue)
            {
                query = query.Where(x => x.StakeholderType == request.StakeholderType);
            }

            if (request.CycleId.HasValue)
            {
                query = query.Where(x => x.CycleId == request.CycleId);
            }

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.Name.Contains(request.TextSearch));
            }

            // === Role-based visibility filter ===
            var username = _contextAccessor.HttpContext.User.Identity.Name;
            bool isAdmin = string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                var userIdString = _contextAccessor.HttpContext.User.Claims
                    .FirstOrDefault(x => x.Type == "name")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out var userId))
                {
                    var userCycleIds = await _catalogService
                        .GetCycleIdsByUserAsync(userIdString);
                    query = query.Where(x => userCycleIds.Contains(x.CycleId));
                }
                else
                {
                    return new GetListPagingResponse<ModelSurveyCampaignGetListPaging>
                    {
                        PageIndex = request.PageIndex,
                        PageSize = request.PageSize,
                        TotalRow = 0,
                        Data = new List<ModelSurveyCampaignGetListPaging>()
                    };
                }
            }
            // === END: Role-based visibility filter ===

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ProjectTo<ModelSurveyCampaignGetListPaging>(_mapper.ConfigurationProvider)
                .ToListAsync();

            // Left join with cycles in memory
            var result = data
                .GroupJoin(
                    cycles,
                    surveyCampaign => surveyCampaign.CycleId,
                    cycle => cycle.Id,
                    (surveyCampaign, matchedCycles) => new { surveyCampaign, matchedCycles })
                .SelectMany(
                    x => x.matchedCycles.DefaultIfEmpty(),
                    (x, cycle) =>
                    {
                        x.surveyCampaign.Cycle = cycle?.Name;
                        return x.surveyCampaign;
                    })
                .ToList();

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
            var query = _context.SurveyCampaigns
                .Where(x => !x.IsDeleted && x.IsActived == true);

            // === Role-based visibility filter ===
            var username = _contextAccessor.HttpContext.User.Identity.Name;
            bool isAdmin = string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase);

            if (!isAdmin)
            {
                var userIdString = _contextAccessor.HttpContext.User.Claims
                    .FirstOrDefault(x => x.Type == "name")?.Value;
                if (!string.IsNullOrEmpty(userIdString) && Guid.TryParse(userIdString, out _))
                {
                    var userCycleIds = await _catalogService.GetCycleIdsByUserAsync(userIdString);
                    query = query.Where(x => userCycleIds.Contains(x.CycleId));
                }
                else
                {
                    return new List<ModelCombobox>();
                }
            }
            // === END: Role-based visibility filter ===

            var data = await query.ToListAsync();
            return data
                .Select(x => new ModelCombobox
                {
                    Text = x.Name,
                    Value = x.Id.ToString()
                })
                .OrderBy(x => x.Text)
                .ToList();
        }

        /// <summary>
        /// Draft -> Sent -> Completed
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        /// <exception cref="Exception"></exception>
        public async Task ChangeStatus(GetByIdRequest request)
        {
            var data = await _context.SurveyCampaigns.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckCycleStageAsync(data.CycleId.ToString());
            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            switch (data.Status)
            {
                case ((int)SurveyCampaignStatus.Draft):
                    // 1. Update Status
                    data.Status = (int)SurveyCampaignStatus.Sent;
                    data.UpdatedAt = DateTime.Now;
                    data.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.SurveyCampaigns.Update(data);

                    // 2. Queue Email Job
                    var campaignId = data.Id;
                    var campaignName = data.Name;
                    var campaignUpdatedAt = data.UpdatedAt;
                    var campaignUpdatedBy = data.UpdatedBy;

                    await _taskQueue.QueueBackgroundWorkItemAsync(async (serviceProvider, token) =>
                    {
                        using var scope = serviceProvider.CreateScope();
                        var context = scope.ServiceProvider.GetRequiredService<BusinessContext>();
                        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

                        // Get active sessions for this campaign
                        var sessions = await context.SurveySessions
                            .Where(x => x.CampaignId == campaignId && !x.IsDeleted && x.Status == (int)SurveySessionStatus.Draft)
                            .ToListAsync(token);

                        var batches = sessions.Chunk(5);
                        foreach (var batch in batches)
                        {
                            if (token.IsCancellationRequested) break;

                            // 1. Send emails in parallel
                            var emailTasks = batch.Select(async session =>
                            {
                                string subject = $"Mời tham gia khảo sát: {campaignName}";
                                string link = $"{_configuration["App:BaseUrl"]}/survey/do-survey?token={session.Token}";

                                string body = EmailTemplateHelper.GetSurveyInvitationBody(session.StakeholderName, campaignName, link);

                                try
                                {
                                    await emailService.SendEmailAsync(session.StakeholderEmail, subject, body);
                                }
                                catch
                                {
                                }
                            });

                            await Task.WhenAll(emailTasks);

                            // 2. Update DB sequentially
                            foreach (var session in batch)
                            {
                                session.SentDate = campaignUpdatedAt;
                                session.Status = ((int)SurveySessionStatus.Sent);
                                session.UpdatedAt = campaignUpdatedAt;
                                session.UpdatedBy = campaignUpdatedBy;

                                context.SurveySessions.Update(session);
                            }
                            await context.SaveChangesAsync(token);
                        }
                    });

                    break;

                case ((int)SurveyCampaignStatus.Sent):
                    data.Status = (int)SurveyCampaignStatus.Completed;
                    data.UpdatedAt = DateTime.Now;
                    data.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    _context.SurveyCampaigns.Update(data);
                    break;

                case ((int)SurveyCampaignStatus.Completed):
                    throw new Exception("Chiến dịch đã kết thúc, không thể thay đổi trạng thái");

                default:
                    throw new Exception("Trạng thái không hợp lệ");
            }

            await _context.SaveChangesAsync();
        }

        public async Task<ModelDoSurvey> GetSurveyByToken(GetSurveyByTokenRequest request)
        {
            // 1. Validate Token
            var session = await _context.SurveySessions
                .FirstOrDefaultAsync(x => x.Token == request.Token && !x.IsDeleted);

            if (session == null)
            {
                throw new Exception("Liên kết khảo sát không hợp lệ");
            }

            // 2. Get Campaign
            var campaignReq = await GetById(new GetByIdRequest { Id = session.CampaignId });

            if (campaignReq.Status == (int)SurveyCampaignStatus.Draft)
            {
                throw new Exception("Chiến dịch chưa bắt đầu");
            }

            if (campaignReq.Status == (int)SurveyCampaignStatus.Completed)
            {
                throw new Exception("Chiến dịch đã kết thúc");
            }

            // 3. Map to SurveyViewDto
            var result = new ModelDoSurvey
            {
                Id = campaignReq.Id,
                Name = campaignReq.Name,
                StakeholderType = campaignReq.StakeholderType,
                IsSessionCompleted = session.Status == (int)SurveySessionStatus.Completed,
                ListTopic = campaignReq.ListTopic.Select(t => new TemplateTopicRequest
                {
                    Id = t.Id,
                    Title = t.Title,
                    HasTextQuestionPart = t.HasTextQuestionPart,
                    TextQuestionTitle = t.TextQuestionTitle,
                    Sort = t.Sort,
                    ListCategory = t.ListCategory.Select(c => new TemplateCategoryRequest
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Sort = c.Sort,
                        ListQuestion = c.ListQuestion.Select(q => new TemplateQuestionRequest
                        {
                            Id = q.Id,
                            Content = q.Content,
                            Sort = q.Sort
                        }).ToList()
                    }).ToList(),
                    ListTextQuestion = t.ListTextQuestion.Select(tq => new TemplateTextQuestionRequest
                    {
                        Id = tq.Id,
                        Content = tq.Content,
                        IsRequired = tq.IsRequired,
                        Sort = tq.Sort
                    }).ToList()
                }).ToList()
            };

            // 4. Fill Answers if completed
            if (result.IsSessionCompleted)
            {
                var scores = await _context.SurveyScores
                    .Where(x => x.SessionId == session.Id)
                    .ToListAsync();

                var textAnswers = await _context.SurveyTextAnswers
                    .Where(x => x.SessionId == session.Id)
                    .ToListAsync();

                foreach (var topic in result.ListTopic)
                {
                    foreach (var cat in topic.ListCategory)
                    {
                        foreach (var q in cat.ListQuestion)
                        {
                            var s = scores.FirstOrDefault(x => x.QuestionId == q.Id);
                            if (s != null) q.Score = s.Score;
                        }
                    }

                    foreach (var tq in topic.ListTextQuestion)
                    {
                        var a = textAnswers.FirstOrDefault(x => x.TextQuestionId == tq.Id);
                        if (a != null) tq.Answer = a.Content;
                    }
                }
            }

            return result;
        }

        public async Task SubmitSurvey(SurveySubmissionRequest request)
        {
            // 1. Validate Token
            var session = await _context.SurveySessions
                .FirstOrDefaultAsync(x => x.Token == request.Token && !x.IsDeleted);

            if (session == null)
            {
                throw new Exception("Liên kết khảo sát không hợp lệ");
            }

            var now = DateTime.Now;
            var stakeholderName = session.StakeholderName;

            var campaign = await _context.SurveyCampaigns.FindAsync(session.CampaignId);
            if (campaign == null)
            {
                throw new Exception("Không tìm thấy thông tin chiến dịch");
            }

            if (campaign.Status == (int)SurveyCampaignStatus.Draft)
            {
                throw new Exception("Chiến dịch chưa bắt đầu");
            }

            // NEW: Clean up existing answers if re-submitting (for editing)
            if (session.Status == (int)SurveySessionStatus.Completed)
            {
                var oldScores = _context.SurveyScores.Where(x => x.SessionId == session.Id);
                _context.SurveyScores.RemoveRange(oldScores);

                var oldTextAnswers = _context.SurveyTextAnswers.Where(x => x.SessionId == session.Id);
                _context.SurveyTextAnswers.RemoveRange(oldTextAnswers);
            }

            // 2. Save Scores
            if (request.Scores != null && request.Scores.Any())
            {
                foreach (var score in request.Scores)
                {
                    var add = _mapper.Map<Entities.SurveyScore>(score);
                    add.Id = Guid.NewGuid();
                    add.SessionId = session.Id;
                    add.CreatedBy = stakeholderName;
                    add.CreatedAt = now;
                    await _context.SurveyScores.AddAsync(add);
                }
            }

            // 3. Save Text Answers
            if (request.TextAnswers != null && request.TextAnswers.Any())
            {
                foreach (var answer in request.TextAnswers)
                {
                    if (string.IsNullOrWhiteSpace(answer.Content)) continue;

                    var add = _mapper.Map<Entities.SurveyTextAnswer>(answer);
                    add.Id = Guid.NewGuid();
                    add.SessionId = session.Id;
                    add.CreatedBy = stakeholderName;
                    add.CreatedAt = now;
                    await _context.SurveyTextAnswers.AddAsync(add);
                }
            }

            // 4. Update Session Status
            session.Status = (int)SurveySessionStatus.Completed;
            session.UpdatedBy = stakeholderName;
            session.UpdatedAt = now;
            _context.SurveySessions.Update(session);

            await _context.SaveChangesAsync();
        }
        #endregion

        #region Session
        public async Task<GetListPagingResponse<StakeholderDto>> GetStakeholdersNotInCampaign(GetStakeholdersNotInCampaignRequest request)
        {
            // 1. Lấy danh sách StakeholderId đã có trong campaign này
            var existingStakeholderIds = await _context.SurveySessions
                .Where(x => x.CampaignId == request.CampainId && !x.IsDeleted)
                .Select(x => x.StakeholderId)
                .ToListAsync();

            // 2. Lấy tất cả stakeholders từ Catalog service
            var campaign = await _context.SurveyCampaigns.FindAsync(request.CampainId);
            if (campaign == null)
            {
                throw new Exception("Chiến dịch khảo sát không tồn tại");
            }
            await CheckPdcaPermissionAsync(campaign.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));
            var allStakeholders = await _catalogService
                .GetStakeholdersStreamAsync(new CatalogService.Protos.GetStakeholdersStreamRequest
                {
                    StakeholderType = campaign.StakeholderType
                })
                .ToListAsync();

            // 3. Lọc ra những stakeholder chưa có trong campaign
            var availableStakeholders = allStakeholders
                .Where(s => !existingStakeholderIds.Contains(s.Id))
                .AsQueryable();

            // 4. Apply search filter (nếu có)
            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                var searchTerm = request.TextSearch.ToLower();
                availableStakeholders = availableStakeholders
                    .Where(s => s.FullName.ToLower().Contains(searchTerm)
                             || s.Email.ToLower().Contains(searchTerm));
            }

            // 5. Pagination
            var totalRow = availableStakeholders.Count();
            List<StakeholderDto> data;

            if (request.PageIndex == -1)
            {
                data = availableStakeholders.ToList();
            }
            else
            {
                data = availableStakeholders
                    .Skip((request.PageIndex - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .ToList();
            }

            return new GetListPagingResponse<StakeholderDto>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task<GetListPagingResponse<ModelSurveySession>> GetListSession(SurveySessionGetListPagingRequest request)
        {
            var sessionCampaign = await _context.SurveyCampaigns.FindAsync(request.CampaignId)
                ?? throw new Exception("Chiến dịch không tồn tại");
            await CheckPdcaPermissionAsync(sessionCampaign.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary, CouncilRole.Evaluator, CouncilRole.EvidenceProvider));

            var query = _context.SurveySessions
                .Where(x => x.CampaignId == request.CampaignId && !x.IsDeleted);

            if (request.Status.HasValue)
            {
                query = query.Where(x => x.Status == request.Status);
            }

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.StakeholderName.Contains(request.TextSearch)
                    || x.StakeholderEmail.Contains(request.TextSearch)
                );
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderBy(x => x.StakeholderName).ThenBy(x => x.StakeholderEmail)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ProjectTo<ModelSurveySession>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new GetListPagingResponse<ModelSurveySession>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task AddListStakeholderToCampaign(AddListStakeholderToCampaignRequest request)
        {
            var data = await _context.SurveyCampaigns.FindAsync(request.CampaignId);
            if (data == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckCycleStageAsync(data.CycleId.ToString());
            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            if (!request.StakeholderIds.Any())
            {
                throw new Exception("Danh sách người tham gia không được để trống");
            }

            foreach (var stakeholderId in request.StakeholderIds)
            {
                var stakeholder = await _catalogService.GetStakeholdersStreamAsync(new CatalogService.Protos.GetStakeholdersStreamRequest
                {
                    Id = stakeholderId.ToString()
                }).FirstOrDefaultAsync();

                if (stakeholder == null)
                {
                    throw new Exception($"Người tham gia với ID {stakeholderId} không tồn tại");
                }

                var add = new Entities.SurveySession
                {
                    Id = Guid.NewGuid(),
                    CampaignId = request.CampaignId,
                    StakeholderId = stakeholder.Id,
                    StakeholderName = stakeholder.FullName,
                    StakeholderEmail = stakeholder.Email,
                    Token = Guid.NewGuid().ToString(),
                    Status = (int)SurveySessionStatus.Draft,
                    CreatedBy = _contextAccessor.HttpContext.User.Identity.Name,
                    CreatedAt = DateTime.Now,
                    IsActived = true,
                    IsDeleted = false
                };

                await _context.SurveySessions.AddAsync(add);
            }
            await _context.SaveChangesAsync();
        }

        public async Task AddAllStakeholderToCampaign(AddAllStakeholderToCampaignRequest request)
        {
            var data = await _context.SurveyCampaigns.FindAsync(request.CampaignId);
            if (data == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckCycleStageAsync(data.CycleId.ToString());
            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            var stakeholder = await GetStakeholdersNotInCampaign(new GetStakeholdersNotInCampaignRequest
            {
                CampainId = request.CampaignId,
                TextSearch = request.Filter_TextSearch,
                PageIndex = -1,
                PageSize = 0
            });

            if (!stakeholder.Data.Any())
            {
                throw new Exception("Không có người tham gia nào phù hợp để thêm vào chiến dịch");
            }

            foreach (var item in stakeholder.Data)
            {
                var add = new Entities.SurveySession
                {
                    Id = Guid.NewGuid(),
                    CampaignId = request.CampaignId,
                    StakeholderId = item.Id,
                    StakeholderName = item.FullName,
                    StakeholderEmail = item.Email,
                    Token = Guid.NewGuid().ToString(),
                    Status = (int)SurveySessionStatus.Draft,
                    CreatedBy = _contextAccessor.HttpContext.User.Identity.Name,
                    CreatedAt = DateTime.Now,
                    IsActived = true,
                    IsDeleted = false
                };
                await _context.SurveySessions.AddAsync(add);
            }

            await _context.SaveChangesAsync();
        }

        public async Task DeleteListSession(DeleteListRequest request)
        {
            if (request.Ids == null || !request.Ids.Any()) return;

            var sessions = await _context.SurveySessions
                .Where(x => request.Ids.Contains(x.Id) && !x.IsDeleted)
                .ToListAsync();

            if (!sessions.Any()) return;

            // Validate based on the first session's campaign
            var firstSession = sessions.First();
            var campaign = await _context.SurveyCampaigns.FindAsync(firstSession.CampaignId);
            if (campaign != null)
            {
                await CheckCycleStageAsync(campaign.CycleId.ToString());
                await CheckPdcaPermissionAsync(campaign.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));
            }
            else
            {
                throw new Exception("Chiến dịch không tồn tại");
            }

            foreach (var session in sessions)
            {
                if (session.Status == ((int)SurveySessionStatus.Completed))
                {
                    throw new Exception("Không thể xóa người đã hoàn thành khảo sát");
                }

                session.IsDeleted = true;
                session.UpdatedAt = DateTime.Now;
                session.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;

                _context.SurveySessions.Update(session);
            }

            await _context.SaveChangesAsync();
        }

        public async Task SendSurveyInvitation(GetByIdRequest request)
        {
            var session = await _context.SurveySessions.FindAsync(request.Id);
            if (session == null)
            {
                throw new Exception("Không tìm thấy thông tin lượt khảo sát");
            }

            var data = await _context.SurveyCampaigns.FindAsync(session.CampaignId);
            if (data == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            await CheckCycleStageAsync(data.CycleId.ToString());
            await CheckPdcaPermissionAsync(data.CycleId.ToString(), Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman, CouncilRole.Secretary));

            var campaign = await _context.SurveyCampaigns.FindAsync(session.CampaignId);
            if (campaign == null)
            {
                throw new Exception("Không tìm thấy thông tin chiến dịch khảo sát");
            }

            string subject = $"Mời tham gia khảo sát: {campaign.Name}";
            string link = $"{_configuration["App:BaseUrl"]}/survey/do-survey?token={session.Token}";
            string body = EmailTemplateHelper.GetSurveyInvitationBody(session.StakeholderName, campaign.Name, link);

            try
            {
                await _emailService.SendEmailAsync(session.StakeholderEmail, subject, body);

                if (session.Status == (int)SurveySessionStatus.Draft)
                {
                    session.Status = (int)SurveySessionStatus.Sent;
                }
                session.SentDate = DateTime.Now;
                session.UpdatedAt = DateTime.Now;
                session.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;

                _context.SurveySessions.Update(session);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Gửi email thất bại: {ex.Message}");
            }
        }
        #endregion

        #region Helpers
        private static List<int> Roles(params CouncilRole[] roles)
            => roles.Select(r => (int)r).ToList();

        private async Task ValidateChildIdsBelongToCampaignAsync(
            SurveyCampaignRequest request,
            Guid campaignId,
            List<Entities.TemplateTopic> existingTopics,
            List<Entities.TemplateCategory> existingCategories,
            List<Entities.TemplateQuestion> existingQuestions,
            List<Entities.TemplateTextQuestion> existingTextQuestions)
        {
            var existingTopicIdSet = existingTopics.Select(x => x.Id).ToHashSet();
            var existingCategoryIdSet = existingCategories.Select(x => x.Id).ToHashSet();
            var existingQuestionIdSet = existingQuestions.Select(x => x.Id).ToHashSet();
            var existingTextQuestionIdSet = existingTextQuestions.Select(x => x.Id).ToHashSet();

            var requestedTopicIds = request.ListTopic
                .Select(x => x.Id)
                .Where(x => x != Guid.Empty)
                .ToHashSet();

            var requestedCategoryIds = request.ListTopic
                .SelectMany(x => x.ListCategory)
                .Select(x => x.Id)
                .Where(x => x != Guid.Empty)
                .ToHashSet();

            var requestedQuestionIds = request.ListTopic
                .SelectMany(x => x.ListCategory)
                .SelectMany(x => x.ListQuestion)
                .Select(x => x.Id)
                .Where(x => x != Guid.Empty)
                .ToHashSet();

            var requestedTextQuestionIds = request.ListTopic
                .SelectMany(x => x.ListTextQuestion)
                .Select(x => x.Id)
                .Where(x => x != Guid.Empty)
                .ToHashSet();

            var foreignTopicIds = requestedTopicIds.Except(existingTopicIdSet).ToList();
            if (foreignTopicIds.Any())
            {
                var conflicted = await _context.TemplateTopics
                    .AsNoTracking()
                    .Where(x => foreignTopicIds.Contains(x.Id) && !x.IsDeleted && x.CampaignId != campaignId)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (conflicted.Any())
                {
                    throw new Exception("Payload không hợp lệ: chứa TopicId không thuộc chiến dịch hiện tại");
                }
            }

            var foreignCategoryIds = requestedCategoryIds.Except(existingCategoryIdSet).ToList();
            if (foreignCategoryIds.Any())
            {
                var conflicted = await _context.TemplateCategories
                    .AsNoTracking()
                    .Where(x => foreignCategoryIds.Contains(x.Id) && !x.IsDeleted)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (conflicted.Any())
                {
                    throw new Exception("Payload không hợp lệ: chứa CategoryId không thuộc chiến dịch hiện tại");
                }
            }

            var foreignQuestionIds = requestedQuestionIds.Except(existingQuestionIdSet).ToList();
            if (foreignQuestionIds.Any())
            {
                var conflicted = await _context.TemplateQuestions
                    .AsNoTracking()
                    .Where(x => foreignQuestionIds.Contains(x.Id) && !x.IsDeleted)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (conflicted.Any())
                {
                    throw new Exception("Payload không hợp lệ: chứa QuestionId không thuộc chiến dịch hiện tại");
                }
            }

            var foreignTextQuestionIds = requestedTextQuestionIds.Except(existingTextQuestionIdSet).ToList();
            if (foreignTextQuestionIds.Any())
            {
                var conflicted = await _context.TemplateTextQuestions
                    .AsNoTracking()
                    .Where(x => foreignTextQuestionIds.Contains(x.Id) && !x.IsDeleted)
                    .Select(x => x.Id)
                    .ToListAsync();

                if (conflicted.Any())
                {
                    throw new Exception("Payload không hợp lệ: chứa TextQuestionId không thuộc chiến dịch hiện tại");
                }
            }
        }

        private async Task CheckPdcaPermissionAsync(string cycleId, List<int>? allowedRoles = null)
        {
            var userId = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")!.Value;
            var allowed = await _catalogService.CanUserDoActionInPdcaAsync(cycleId, userId, null, allowedRoles);
            if (!allowed)
                throw new Exception("Bạn không có quyền thực hiện thao tác này trong chu kỳ PDCA");
        }

        /// <summary>
        /// Kiểm tra chu kỳ có đang ở giai đoạn Thực hiện (Do) không.
        /// Nếu không, chỉ Admin / Chủ tịch / PCT HĐ mới được tiếp tục.
        /// </summary>
        private async Task CheckCycleStageAsync(string cycleId)
        {
            var (found, status) = await _catalogService.GetCycleStatusAsync(cycleId);

            if (!found)
                throw new Exception("Chu kỳ không tồn tại");

            // CycleStatus.Do == 2 (Thực hiện) — matches CatalogService CommonEnum.CycleStatus.Do
            const int CycleStatusDo = 2;
            if (status == CycleStatusDo)
                return;

            // Cycle is not in Do stage — check if caller is privileged
            var username = _contextAccessor.HttpContext!.User.Identity?.Name;
            if (string.Equals(username, "admin", StringComparison.OrdinalIgnoreCase))
                return;

            var userId = _contextAccessor.HttpContext!.User.Claims
                .FirstOrDefault(x => x.Type == "name")?.Value;

            if (string.IsNullOrEmpty(userId))
                throw new Exception("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");

            var allowed = await _catalogService.CanUserDoActionInPdcaAsync(
                cycleId,
                userId,
                null,
                Roles(CouncilRole.HeadOfCouncil, CouncilRole.ViceChairman));

            if (!allowed)
                throw new Exception("Chu kỳ chưa ở giai đoạn Thực hiện, bạn không có quyền thực hiện thao tác này");
        }
        #endregion
    }
}
