using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Score.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Session.Requests;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.TextAnswer.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.SurveyCampaign
{
    public class SurveyCampaignProfile : Profile
    {
        public SurveyCampaignProfile()
        {
            // SurveyCampaign
            CreateMap<Entities.SurveyCampaign, ModelSurveyCampaign>().ReverseMap();
            CreateMap<Entities.SurveyCampaign, ModelSurveyCampaignGetListPaging>()
                .ForMember(dest => dest.Stakeholder,
                    opt => opt.MapFrom(src =>
                        src.StakeholderType == 1 ? "Sinh viên" :
                        src.StakeholderType == 2 ? "Cựu sinh viên" :
                        src.StakeholderType == 3 ? "Nhà tuyển dụng" :
                        src.StakeholderType == 4 ? "Giảng viên" :
                        "Khác"));
            CreateMap<Entities.SurveyCampaign, SurveyCampaignRequest>()
                .ForMember(dest => dest.CycleName,
                    opt => opt.MapFrom(src => src.Cycle != null ? src.Cycle.Name : null));
            CreateMap<SurveyCampaignRequest, Entities.SurveyCampaign>()
                .ForMember(dest => dest.Cycle, opt => opt.Ignore())
                .ForMember(dest => dest.Template, opt => opt.Ignore())
                .ForMember(dest => dest.SurveySessions, opt => opt.Ignore())
                .ForMember(dest => dest.TemplateTopics, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());

            // SurveySession
            CreateMap<Entities.SurveySession, ModelSurveySession>().ReverseMap();
            CreateMap<Entities.SurveySession, SurveySessionRequest>().ReverseMap();

            // SurveyScore
            CreateMap<Entities.SurveyScore, ModelSurveyScore>().ReverseMap();
            CreateMap<Entities.SurveyScore, SurveyScoreRequest>().ReverseMap();

            // SurveyTextAnswer
            CreateMap<Entities.SurveyTextAnswer, ModelSurveyTextAnswer>().ReverseMap();
            CreateMap<Entities.SurveyTextAnswer, SurveyTextAnswerRequest>().ReverseMap();
        }
    }
}
