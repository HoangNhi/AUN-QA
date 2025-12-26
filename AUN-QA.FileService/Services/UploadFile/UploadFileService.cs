using AutoDependencyRegistration.Attributes;

namespace AUN_QA.FileService.Services.UploadFile
{
    [RegisterClassAsTransient]
    public class UploadFileService : IUploadFileService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;

        public UploadFileService(IWebHostEnvironment webHostEnvironment)
        {
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task Insert(List<IFormFile> files, string FolderName)
        {
            var folderPath = Path.Combine(_webHostEnvironment.WebRootPath, "Files/Temp/" + FolderName);
            if (!Directory.Exists(folderPath))
                Directory.CreateDirectory(folderPath);

            foreach (var file in files)
            {
                if (file.Length > 0 && DTOs.Common.CommonConst._fileValid.Contains(Path.GetExtension(file.FileName).ToLower()))
                {
                    using (var stream = new FileStream(folderPath + "/" + file.FileName, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }
                else
                {
                    throw new Exception("Upload file không thành công");
                }
            }

        }
    }
}
