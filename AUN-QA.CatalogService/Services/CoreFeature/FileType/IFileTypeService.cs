using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.FileType
{
    public interface IFileTypeService
    {
        Task<ModelFileType> GetById(GetByIdRequest request);
        Task<ModelFileType> Insert(FileTypeRequest request);
        Task<ModelFileType> Update(FileTypeRequest request);
        Task<string> DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelFileType>> GetList(GetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
