using AUN_QA.Shared.DTOs.Base;
using AUN_QA.FileService.DTOs.Base;

namespace AUN_QA.FileService.Services.CoreFeature.UploadFile
{
    public interface IUploadFileService
    {
        Task Insert(List<IFormFile> files, string FolderName);
        Task<List<ModelAttachment>> InsertAndReturn(List<IFormFile> files, string folderName);
        List<ModelAttachment> UploadData(object lienKetId, string servicePath, string folderName, string tempFolder);
        bool DeleteData(IEnumerable<string> filePaths);
        string UploadAvatar(string folderUploadId, string oldImage);
        ModelFilePreview PreviewFile(string fileUrl);
    }
}
