using AUN_QA.CatalogService.DTOs.Base;
using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Dtos;
using AUN_QA.CatalogService.DTOs.CoreFeature.Faculty.Requests;

namespace AUN_QA.CatalogService.Services.CoreFeature.Faculty
{
    public interface IFacultyService
    {
        ModelFaculty GetById(GetByIdRequest request);
        ModelFaculty Insert(FacultyRequest request);
        ModelFaculty Update(FacultyRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelFaculty>> GetList(GetListPagingRequest request);
        List<ModelCombobox> GetAllForCombobox();
    }
}
