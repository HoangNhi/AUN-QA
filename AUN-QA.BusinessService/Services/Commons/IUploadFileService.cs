using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.Services.Commons
{
    public interface IUploadFileService
    {
        Task<List<ModelAttachment>> UploadDataAsync(string lienKetId, string folderName, string tempFolder);
    }
}
