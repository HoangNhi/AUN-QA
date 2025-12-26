namespace AUN_QA.FileService.Services.UploadFile
{
    public interface IUploadFileService
    {
        Task Insert(List<IFormFile> files, string FolderName);
    }
}
