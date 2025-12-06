using AUN_QA.AssessmentService.DTOs.Base;
using AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Dtos;
using AUN_QA.AssessmentService.DTOs.CoreFeature.Faculty.Requests;

namespace AUN_QA.AssessmentService.Services.Faculty
{
    public interface IFacultyService
    {
        ModelFaculty GetById(GetByIdRequest request);
        ModelFaculty Insert(FacultyRequest request);
        ModelFaculty Update(FacultyRequest request);
        string DeleteList(DeleteListRequest request);
        Task<GetListPagingResponse<ModelFaculty>> GetList(GetListPagingRequest request);
    }
}
