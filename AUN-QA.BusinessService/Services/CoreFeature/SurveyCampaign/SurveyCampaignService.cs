using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
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

        #region Chức năng chính
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

            result.ListSession = _mapper.Map<List<SurveySessionRequest>>(stakeholderDtos);
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

            #region Người tham gia
            if (!request.ListSession.Any())
            {
                throw new Exception("Khảo sát phải có ít nhất một người tham gia");
            }

            foreach (var sessionReq in request.ListSession)
            {
                var addSession = _mapper.Map<Entities.SurveySession>(sessionReq);
                addSession.Id = sessionReq.Id == Guid.Empty ? Guid.NewGuid() : sessionReq.Id;
                addSession.CampaignId = add.Id;
                addSession.Token = Guid.NewGuid().ToString();
                addSession.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                addSession.CreatedAt = DateTime.Now;
                await _context.SurveySessions.AddAsync(addSession);
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
                    newTopic.TemplateId = update.Id;
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

            #region Người tham gia
            // 1. Fetch existing sessions for this campaign
            var existingSessions = await _context.SurveySessions
                .Where(x => x.CampaignId == update.Id && !x.IsDeleted)
                .ToListAsync();

            // 2. Validate that at least one participant exists
            if (!request.ListSession.Any())
            {
                throw new Exception("Khảo sát phải có ít nhất một người tham gia");
            }

            // 3. Process each session in the request
            foreach (var sessionReq in request.ListSession)
            {
                var existingSession = existingSessions.FirstOrDefault(x => x.Id == sessionReq.Id);

                if (existingSession != null)
                {
                    existingSession.StakeholderId = sessionReq.StakeholderId;
                    existingSession.StakeholderName = sessionReq.StakeholderName;
                    existingSession.StakeholderEmail = sessionReq.StakeholderEmail;
                    existingSession.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    existingSession.UpdatedAt = DateTime.Now;
                    _context.SurveySessions.Update(existingSession);

                    existingSessions.Remove(existingSession);
                }
                else
                {
                    // Add new session
                    var newSession = _mapper.Map<Entities.SurveySession>(sessionReq);
                    newSession.Id = sessionReq.Id == Guid.Empty ? Guid.NewGuid() : sessionReq.Id;
                    newSession.CampaignId = update.Id;
                    newSession.Token = Guid.NewGuid().ToString();
                    newSession.Status = ((int)SurveySessionStatus.Draft);
                    newSession.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    newSession.CreatedAt = DateTime.Now;
                    await _context.SurveySessions.AddAsync(newSession);
                }
            }

            // 4. Soft-delete sessions that were removed from the request
            foreach (var session in existingSessions)
            {
                session.IsDeleted = true;
                session.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                session.UpdatedAt = DateTime.Now;
                _context.SurveySessions.Update(session);
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

        #endregion
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
