using AUN_QA.BusinessService.DTOs.Base;
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

        public SurveyCampaignService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor,
            ICatalogIntegrationService catalogService,
            IBackgroundTaskQueue taskQueue,
            IEmailService emailService)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
            _catalogService = catalogService;
            _taskQueue = taskQueue;
            _emailService = emailService;
        }

        #region SurveyCampaign
        public async Task<SurveyCampaignRequest> GetById(GetByIdRequest request)
        {
            var data = await _context.SurveyCampaigns.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<SurveyCampaignRequest>(data);

            #region Chủ đề khảo sát và nhóm câu hỏi
            // 1. Get raw data
            var topics = await _context.TemplateTopics
                .Where(x => x.CampaignId == result.Id && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var topicIds = topics.Select(x => x.Id).ToList();

            var categories = await _context.TemplateCategories
                .Where(x => topicIds.Contains(x.TopicId) && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var categoryIds = categories.Select(x => x.Id).ToList();

            var questions = await _context.TemplateQuestions
                .Where(x => categoryIds.Contains(x.CategoryId) && !x.IsDeleted)
                .OrderBy(x => x.Sort)
                .ToListAsync();

            var textQuestions = await _context.TemplateTextQuestions
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
                .Where(x => x.CampaignId == result.Id && !x.IsDeleted)
                .OrderBy(x => x.StakeholderName)
                .ToListAsync();
            #endregion

            return result;
        }

        public async Task<ModelSurveyCampaign> Insert(SurveyCampaignRequest request)
        {
            var userId = _contextAccessor.HttpContext.User.Claims.FirstOrDefault(x => x.Type == "name").Value;
            var isHeadOfCouncil = await _catalogService.IsUserInRoleAsync(request.CycleId.ToString(), userId, ((int)CouncilRole.HeadOfCouncil));
            if (!isHeadOfCouncil)
            {
                throw new Exception("Chỉ trưởng hội đồng mới có quyền tạo khảo sát");
            }

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
                    newTopic.Id = topicReq.Id == Guid.Empty ? Guid.NewGuid() : topicReq.Id;
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
                        newCategory.Id = catReq.Id == Guid.Empty ? Guid.NewGuid() : catReq.Id;
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
                            newQuestion.Id = qReq.Id == Guid.Empty ? Guid.NewGuid() : qReq.Id;
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
                        newTextQ.Id = txtReq.Id == Guid.Empty ? Guid.NewGuid() : txtReq.Id;
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
                delete.UpdatedAt = DateTime.Now;

                _context.SurveyCampaigns.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelSurveyCampaignGetListPaging>> GetList(SurveyCampaignGetListPagingRequest request)
        {
            var cycles = await _catalogService.GetCyclesStreamAsync(new CatalogService.Protos.GetCyclesStreamRequest()).ToListAsync();

            var query = _context.SurveyCampaigns
                .Where(x => !x.IsDeleted);

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
            var data = await _context.SurveyCampaigns.Where(x => !x.IsDeleted && x.IsActived == true).ToListAsync();
            return data.Select(x => new ModelCombobox
            {
                Text = x.Name,
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
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
                                string link = $"http://localhost:5173/survey/do-survey?token={session.Token}";

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
            if (!request.ListStakeholderId.Any())
            {
                throw new Exception("Danh sách người tham gia không được để trống");
            }

            foreach (var stakeholderId in request.ListStakeholderId)
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
                    CreatedAt = DateTime.Now
                };

                await _context.SurveySessions.AddAsync(add);
            }
            await _context.SaveChangesAsync();
        }

        public async Task AddAllStakeholderToCampaign(AddAllStakeholderToCampaignRequest request)
        {
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
                    CreatedAt = DateTime.Now
                };
                await _context.SurveySessions.AddAsync(add);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<string> DeleteListSession(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.SurveySessions.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                if (delete.Status == ((int)SurveySessionStatus.Completed))
                {
                    continue;
                }

                delete.IsDeleted = true;
                delete.UpdatedAt = DateTime.Now;
                delete.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;

                _context.SurveySessions.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task SendSurveyInvitation(GetByIdRequest request)
        {
            var session = await _context.SurveySessions.FindAsync(request.Id);
            if (session == null)
            {
                throw new Exception("Không tìm thấy thông tin lượt khảo sát");
            }

            var campaign = await _context.SurveyCampaigns.FindAsync(session.CampaignId);
            if (campaign == null)
            {
                throw new Exception("Không tìm thấy thông tin chiến dịch khảo sát");
            }

            string subject = $"Mời tham gia khảo sát: {campaign.Name}";
            string link = $"http://localhost:5173/survey/do-survey?token={session.Token}";
            string body = EmailTemplateHelper.GetSurveyInvitationBody(session.StakeholderName, campaign.Name, link);

            try
            {
                await _emailService.SendEmailAsync(session.StakeholderEmail, subject, body);

                session.Status = (int)SurveySessionStatus.Sent;
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
    }
}
