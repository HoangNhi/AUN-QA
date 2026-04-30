using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.Faculty
{
    public class FacultyProfile : Profile
    {
        public FacultyProfile()
        {
            CreateMap<Entities.Faculty, ModelFaculty>().ReverseMap();
            CreateMap<FacultyRequest, Entities.Faculty>().ReverseMap();
        }
    }
}
