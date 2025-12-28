using AUN_QA.FileService.DTOs.Base;

namespace AUN_QA.FileService.Services.UploadFile
{
    public interface IUploadFileService
    {
        Task Insert(List<IFormFile> files, string FolderName);
        List<ModelAttachment> UploadData(object lienKetId, string servicePath, string folderName, string tempFolder);
    }
}
