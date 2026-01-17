using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using AUN_QA.BusinessService.Infrastructure.Data;
using AutoDependencyRegistration.Attributes;
using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Services.CoreFeature.SurveyTemplate
{
    [RegisterClassAsTransient]
    public class SurveyTemplateService : ISurveyTemplateService
    {
        private readonly BusinessContext _context;
        private readonly IMapper _mapper;
        private readonly IHttpContextAccessor _contextAccessor;

        public SurveyTemplateService(
            BusinessContext context,
            IMapper mapper,
            IHttpContextAccessor contextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _contextAccessor = contextAccessor;
        }

        public async Task<ModelSurveyTemplate> GetById(GetByIdRequest request)
        {
            var data = await _context.SurveyTemplates.FindAsync(request.Id);
            if (data == null)
            {
                throw new Exception("Không tìm thấy dữ liệu");
            }

            var result = _mapper.Map<ModelSurveyTemplate>(data);

            // 1. Get raw data
            var topics = await _context.TemplateTopics
                .Where(x => x.TemplateId == result.Id && !x.IsDeleted)
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

            return result;
        }

        public async Task<ModelSurveyTemplate> Insert(SurveyTemplateRequest request)
        {
            var data = _context.SurveyTemplates.Where(x =>
                x.Title == request.Title
                && !x.IsDeleted
            );

            if (await data.AnyAsync())
            {
                throw new Exception("Tên mẫu khảo sát đã tồn tại");
            }

            var add = _mapper.Map<Entities.SurveyTemplate>(request);
            add.Id = request.Id == Guid.Empty ? Guid.NewGuid() : request.Id;
            add.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            add.CreatedAt = DateTime.Now;
            await _context.SurveyTemplates.AddAsync(add);

            #region Chủ đề khảo sát và nhóm câu hỏi
            if (!request.ListTopic.Any())
            {
                throw new Exception("Mẫu khảo sát phải có ít nhất một chủ đề khảo sát");
            }

            foreach (var topicReq in request.ListTopic)
            {
                var addTopic = _mapper.Map<Entities.TemplateTopic>(topicReq);
                addTopic.Id = topicReq.Id == Guid.Empty ? Guid.NewGuid() : topicReq.Id;
                addTopic.TemplateId = add.Id;
                addTopic.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                addTopic.CreatedAt = DateTime.Now;
                await _context.TemplateTopics.AddAsync(addTopic);

                #region Nhóm câu hỏi và câu hỏi
                if (!topicReq.ListCategory.Any())
                {
                    throw new Exception($"Chủ đề '{topicReq.Title}' phải có ít nhất một nhóm câu hỏi");
                }

                foreach (var catReq in topicReq.ListCategory)
                {
                    var addcategory = _mapper.Map<Entities.TemplateCategory>(catReq);
                    addcategory.Id = catReq.Id == Guid.Empty ? Guid.NewGuid() : catReq.Id;
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
                        addQuestion.Id = question.Id == Guid.Empty ? Guid.NewGuid() : question.Id;
                        addQuestion.CategoryId = addcategory.Id;
                        addQuestion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                        addQuestion.CreatedAt = DateTime.Now;
                        await _context.TemplateQuestions.AddAsync(addQuestion);
                    }
                }
                #endregion

                #region Ý kiến khác
                if (topicReq.HasTextQuestionPart && !topicReq.ListTextQuestion.Any())
                {
                    throw new Exception($"Phần ý kiến khác của chủ đề '{topicReq.Title}' phải có ít nhất một câu hỏi");
                }

                foreach (var textQuestion in topicReq.ListTextQuestion)
                {
                    var addTextQuestion = _mapper.Map<Entities.TemplateTextQuestion>(textQuestion);
                    addTextQuestion.Id = textQuestion.Id == Guid.Empty ? Guid.NewGuid() : textQuestion.Id;
                    addTextQuestion.TopicId = addTopic.Id;
                    addTextQuestion.CreatedBy = _contextAccessor.HttpContext.User.Identity.Name;
                    addTextQuestion.CreatedAt = DateTime.Now;
                    await _context.TemplateTextQuestions.AddAsync(addTextQuestion);
                }
                #endregion
            }
            #endregion

            await _context.SaveChangesAsync();
            return _mapper.Map<ModelSurveyTemplate>(add);
        }

        public async Task<ModelSurveyTemplate> Update(SurveyTemplateRequest request)
        {
            var data = _context.SurveyTemplates.Where(x =>
                x.Title == request.Title
                && !x.IsDeleted && x.Id != request.Id);

            if (await data.AnyAsync())
            {
                throw new Exception("Tên mẫu khảo sát đã tồn tại");
            }

            var update = await _context.SurveyTemplates.FindAsync(request.Id);
            if (update == null)
            {
                throw new Exception("Dữ liệu không tồn tại");
            }

            _mapper.Map(request, update);

            update.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;
            update.UpdatedAt = DateTime.Now;

            _context.SurveyTemplates.Update(update);

            #region Chủ đề khảo sát và nhóm câu hỏi
            // 1. Fetch existing data
            var existingTopics = await _context.TemplateTopics
                .Where(x => x.TemplateId == update.Id && !x.IsDeleted)
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
                throw new Exception("Mẫu khảo sát phải có ít nhất một chủ đề khảo sát");
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

                #region Process Categories
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

                    #region Process Questions
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
                    #endregion
                }
                #endregion

                #region Process Text Questions
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
                #endregion
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

            return _mapper.Map<ModelSurveyTemplate>(update);
        }

        public async Task<string> DeleteList(DeleteListRequest request)
        {
            foreach (var id in request.Ids)
            {
                var delete = await _context.SurveyTemplates.FindAsync(id);
                if (delete == null)
                {
                    throw new Exception("Dữ liệu không tồn tại");
                }

                delete.IsDeleted = true;
                delete.UpdatedBy = _contextAccessor.HttpContext.User.Identity.Name;

                _context.SurveyTemplates.Update(delete);
            }

            await _context.SaveChangesAsync();
            return String.Join(',', request.Ids);
        }

        public async Task<GetListPagingResponse<ModelSurveyTemplateGetListPaging>> GetList(SurveyTemplateGetListPagingRequest request)
        {
            var query = _context.SurveyTemplates
                .Where(x => !x.IsDeleted);

            if (request.StakeholderType.HasValue)
            {
                query = query.Where(x => x.StakeholderType == request.StakeholderType);
            }

            if (!string.IsNullOrEmpty(request.TextSearch))
            {
                query = query.Where(x =>
                    x.Title.Contains(request.TextSearch)
                    || x.Description.Contains(request.TextSearch));
            }

            var totalRow = await query.CountAsync();

            var data = await query
                .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
                .Skip((request.PageIndex - 1) * request.PageSize)
                .Take(request.PageSize)
                .ProjectTo<ModelSurveyTemplateGetListPaging>(_mapper.ConfigurationProvider)
                .ToListAsync();

            return new GetListPagingResponse<ModelSurveyTemplateGetListPaging>
            {
                PageIndex = request.PageIndex,
                PageSize = request.PageSize,
                TotalRow = totalRow,
                Data = data
            };
        }

        public async Task<List<ModelCombobox>> GetAllForCombobox(SurveyTemplateGetComboboxRequest request)
        {
            var data = await _context.SurveyTemplates.Where(
                x => !x.IsDeleted && x.IsActived == true
                && (request.StakeholderType == null || x.StakeholderType == request.StakeholderType)
            ).ToListAsync();

            return data.Select(x => new ModelCombobox
            {
                Text = x.Title,
                Value = x.Id.ToString()
            }).OrderBy(x => x.Text).ToList();
        }
    }
}
