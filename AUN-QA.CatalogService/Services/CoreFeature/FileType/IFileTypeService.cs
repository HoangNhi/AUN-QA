using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.FileType.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.FileType
{
    public interface IFileTypeService
    {
        Task<ModelFileType> GetById(GetByIdRequest request);
        Task Insert(FileTypeRequest request);
        Task Update(FileTypeRequest request);
        Task DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelFileType>> GetList(FileTypeGetListPagingRequest request);
        Task<List<ModelCombobox>> GetAllForCombobox();
    }
}
