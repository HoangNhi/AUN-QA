using AUN_QA.BusinessService.DTOs.Base;

namespace AUN_QA.BusinessService.Services.Commons.UploadFile
{
    public interface IUploadFileService
    {
        Task<List<ModelAttachment>> UploadDataAsync(string lienKetId, string folderName, string tempFolder);
        Task<bool> DeleteDataAsync(List<string> filePaths);
        Task<ModelFilePreview> PreviewFileAsync(string fileUrl, string mode = "internal");
    }
}
