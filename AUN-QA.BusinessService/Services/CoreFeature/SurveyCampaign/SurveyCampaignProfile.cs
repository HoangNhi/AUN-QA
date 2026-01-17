using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.SurveyCampaign.Requests;
using AutoMapper;

namespace AUN_QA.BusinessService.Services.CoreFeature.SurveyCampaign
{
    public class SurveyCampaignProfile : Profile
    {
        public SurveyCampaignProfile()
        {
            CreateMap<Entities.SurveyCampaign, ModelSurveyCampaign>().ReverseMap();
            CreateMap<Entities.SurveyCampaign, ModelSurveyCampaignGetListPaging>()
                .ForMember(dest => dest.Stakeholder,
                    opt => opt.MapFrom(src =>
                        src.StakeholderType == 1 ? "Sinh viên" :
                        src.StakeholderType == 2 ? "Cựu sinh viên" :
                        src.StakeholderType == 3 ? "Nhà tuyển dụng" :
                        src.StakeholderType == 4 ? "Giảng viên" :
                        "Khác"));
            CreateMap<Entities.SurveyCampaign, SurveyCampaignRequest>().ReverseMap();
        }
    }
}
