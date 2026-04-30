using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests;
using AutoMapper;

namespace AUN_QA.CatalogService.Services.CoreFeature.FileType
{
    public class FileTypeProfile : Profile
    {
        public FileTypeProfile()
        {
            CreateMap<Entities.FileType, ModelFileType>().ReverseMap();
            CreateMap<FileTypeRequest, Entities.FileType>().ReverseMap();
        }
    }
}
