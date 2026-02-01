using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.StandardSet.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.StandardSet
{
    public class StandardSetProfile : Profile
    {
        public StandardSetProfile()
        {
            CreateMap<Entities.StandardSet, ModelStandardSet>().ReverseMap();
            CreateMap<StandardSetRequest, Entities.StandardSet>().ReverseMap();
            CreateMap<Entities.StandardSet, ModelStandardSetGetListPaging>()
                .ForMember(dest => dest.EvaluationMode_Name, opt => opt.MapFrom(src =>
                    GetEvaluationModeName(src.EvaluationMode)));
        }

        private static string GetEvaluationModeName(int evaluationMode)
        {
            return evaluationMode switch
            {
                1 => "Thang điểm 7",
                2 => "Đạt/Không đạt",
                _ => "Không xác định"
            };
        }
    }
}
