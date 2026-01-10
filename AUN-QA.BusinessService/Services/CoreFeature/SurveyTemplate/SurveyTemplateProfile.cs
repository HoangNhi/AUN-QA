using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyTemplate.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateCategory.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTextQuestion.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.TemplateTopic.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.SurveyTemplate
{
    public class SurveyTemplateProfile : Profile
    {
        public SurveyTemplateProfile()
        {
            // Survey Template
            CreateMap<Entities.SurveyTemplate, ModelSurveyTemplate>().ReverseMap();
            CreateMap<Entities.SurveyTemplate, SurveyTemplateRequest>().ReverseMap();
            CreateMap<Entities.SurveyTemplate, ModelSurveyTemplateGetListPaging>()
                .ForMember(dest => dest.Stakeholder,
                    opt => opt.MapFrom(src =>
                        src.StakeholderType == 1 ? "Sinh viên" :
                        src.StakeholderType == 2 ? "Cựu sinh viên" :
                        src.StakeholderType == 3 ? "Nhà tuyển dụng" :
                        src.StakeholderType == 4 ? "Giảng viên" :
                        "Khác"));

            // TemplateTopic 
            CreateMap<Entities.TemplateTopic, ModelTemplateTopic>().ReverseMap();
            CreateMap<Entities.TemplateTopic, TemplateTopicRequest>().ReverseMap();

            // TemplateCategory
            CreateMap<Entities.TemplateCategory, ModelTemplateCategory>().ReverseMap();
            CreateMap<Entities.TemplateCategory, TemplateCategoryRequest>().ReverseMap();

            // Template Question
            CreateMap<Entities.TemplateQuestion, ModelTemplateQuestion>().ReverseMap();
            CreateMap<Entities.TemplateQuestion, TemplateQuestionRequest>().ReverseMap();

            // TemplateTextQuestion
            CreateMap<Entities.TemplateTextQuestion, ModelTemplateTextQuestion>().ReverseMap();
            CreateMap<Entities.TemplateTextQuestion, TemplateTextQuestionRequest>().ReverseMap();
        }
    }
}
