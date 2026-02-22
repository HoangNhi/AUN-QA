using AUN_QA.Shared.DTOs.Base;
using AUN_QA.FileService.DTOs.Base;
using AUN_QA.FileService.DTOs.Common;
using AutoDependencyRegistration.Attributes;
using Microsoft.AspNetCore.StaticFiles;


namespace AUN_QA.FileService.Services.CoreFeature.UploadFile
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
            if (string.IsNullOrWhiteSpace(FolderName) || FolderName.Contains("..") || FolderName.Contains("/") || FolderName.Contains("\\"))
            {
                throw new Exception("ThÆ° má»¥c lÆ°u trá»¯ khÃ´ng há»£p lá»‡");
            }

            var folderPath = Path.Combine(_webHostEnvironment.WebRootPath, "Files/Temp/" + FolderName);
            if (Directory.Exists(folderPath))
            {
                Directory.Delete(folderPath, recursive: true);
            }

            Directory.CreateDirectory(folderPath);

            string[] _fileValid = CommonConst._fileHinhAnhValid
                .Concat(CommonConst._fileVideoValid)
                .Concat(CommonConst._fileAudioValid)
                .Concat(CommonConst._fileTaiLieuValid)
                .ToArray();

            foreach (var file in files)
            {
                if (file.Length > 0 && _fileValid.Contains(Path.GetExtension(file.FileName).ToLower()))
                {
                    using (var stream = new FileStream(folderPath + "/" + file.FileName, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }
                else
                {
                    throw new Exception("Upload file khÃ´ng thÃ nh cÃ´ng");
                }
            }
        }

        public List<ModelAttachment> UploadData(object lienKetId, string servicePath, string folderName, string tempFolder)
        {
            if (string.IsNullOrWhiteSpace(tempFolder) || tempFolder.Contains("..") || tempFolder.Contains("/") || tempFolder.Contains("\\"))
            {
                throw new Exception("ThÆ° má»¥c lÆ°u trá»¯ táº¡m khÃ´ng há»£p lá»‡");
            }
            if (string.IsNullOrWhiteSpace(folderName) || folderName.Contains("..") || folderName.Contains("/") || folderName.Contains("\\"))
            {
                throw new Exception("ThÆ° má»¥c lÆ°u trá»¯ chÃ­nh khÃ´ng há»£p lá»‡");
            }

            List<ModelAttachment> result = new List<ModelAttachment>();
            string sourceDirPath = Path.Combine(_webHostEnvironment.WebRootPath, "Files\\Temp\\" + tempFolder);
            string destinationDirPath = Path.Combine(_webHostEnvironment.WebRootPath, servicePath, folderName + "\\" + lienKetId.ToString());
            string relativeDirPath = servicePath + "/" + folderName + "/" + lienKetId.ToString();

            result = SyncUploadFile(sourceDirPath, destinationDirPath, relativeDirPath);

            return result;
        }

        public bool DeleteData(IEnumerable<string> filePaths)
        {
            if (filePaths == null || !filePaths.Any())
            {
                return true;
            }

            bool allSuccess = true;
            foreach (var filePath in filePaths)
            {
                try
                {
                    // Construct absolute source path
                    string sourcePath = Path.Combine(_webHostEnvironment.WebRootPath, filePath);

                    // Check if source file exists
                    if (!File.Exists(sourcePath))
                    {
                        allSuccess = false;
                        continue;
                    }

                    var pathSegments = filePath.Split(new char[] { '\\', '/' }, StringSplitOptions.RemoveEmptyEntries);
                    string serviceName = pathSegments.FirstOrDefault() ?? "Common";

                    // Assumes filePath format like "Service/Module/Id/File.ext"
                    string relateId = pathSegments.Length >= 2 ? pathSegments[pathSegments.Length - 2] : "Common";

                    // Construct absolute destination path
                    string destinationDirPath = Path.Combine(_webHostEnvironment.WebRootPath, "Deleted", serviceName, relateId);

                    // Create destination directory if it doesn't exist
                    if (!Directory.Exists(destinationDirPath))
                    {
                        Directory.CreateDirectory(destinationDirPath);
                    }

                    // Get file info
                    FileInfo info = new FileInfo(sourcePath);
                    string fileName = Path.GetFileNameWithoutExtension(sourcePath);
                    string extension = info.Extension;

                    // Handle file name collisions
                    string destFilePath = Path.Combine(destinationDirPath, fileName + extension);
                    int counter = 1;
                    while (File.Exists(destFilePath))
                    {
                        destFilePath = Path.Combine(destinationDirPath, $"{fileName}({counter}){extension}");
                        counter++;
                    }

                    // Move file
                    File.Move(sourcePath, destFilePath);
                }
                catch (Exception)
                {
                    allSuccess = false;
                }
            }

            return allSuccess;
        }

        public string UploadAvatar(string folderUploadId, string oldImage)
        {
            string path = oldImage;
            string folderUploadPath = Path.Combine(_webHostEnvironment.WebRootPath, "Files\\Temp\\" + folderUploadId);
            if (Directory.Exists(folderUploadPath))
            {
                string[] arrFiles = Directory.GetFiles(folderUploadPath);
                if (arrFiles.Count() > 0) //cÃ³ Ä‘Ã­nh kÃ¨m
                {
                    FileInfo info = new FileInfo(arrFiles[0]);
                    string fileName = Guid.NewGuid().ToString() + info.Extension;
                    string avataPath = Path.Combine(_webHostEnvironment.WebRootPath, "System\\Avatar");
                    //Kiá»ƒm tra náº¿u thÆ° má»¥c chÆ°a tá»“n táº¡i thÃ¬ táº¡o má»›i.
                    if (!Directory.Exists(avataPath))
                    {
                        Directory.CreateDirectory(avataPath);
                    }

                    //XÃ³a áº£nh cÅ© náº¿u tá»“n táº¡i
                    if (File.Exists(avataPath + "\\" + oldImage))
                    {
                        File.Delete(avataPath + "\\" + oldImage);
                    }

                    //Copy áº£nh má»›i
                    File.Move(arrFiles[0], avataPath + "\\" + fileName, true);
                    path = "System\\Avatar\\" + fileName;
                }

                //XÃ³a thÆ° má»¥c táº¡m.
                Directory.Delete(folderUploadPath, true);
            }

            return path;
        }

        public ModelFilePreview PreviewFile(string fileUrl)
        {
            if (string.IsNullOrWhiteSpace(fileUrl))
            {
                throw new Exception("ÄÆ°á»ng dáº«n tá»‡p khÃ´ng há»£p lá»‡");
            }

            var normalizedRelativePath = fileUrl
                .Replace("\\", Path.DirectorySeparatorChar.ToString())
                .Replace("/", Path.DirectorySeparatorChar.ToString())
                .TrimStart(Path.DirectorySeparatorChar);

            var webRootPath = _webHostEnvironment.WebRootPath;
            var absolutePath = Path.GetFullPath(Path.Combine(webRootPath, normalizedRelativePath));
            var fullWebRootPath = Path.GetFullPath(webRootPath);

            if (!absolutePath.StartsWith(fullWebRootPath, StringComparison.OrdinalIgnoreCase))
            {
                throw new Exception("ÄÆ°á»ng dáº«n tá»‡p khÃ´ng há»£p lá»‡");
            }

            if (!File.Exists(absolutePath))
            {
                throw new Exception("Tá»‡p khÃ´ng tá»“n táº¡i");
            }

            var fileContent = File.ReadAllBytes(absolutePath);
            var fileName = Path.GetFileName(absolutePath);
            var contentType = GetContentType(absolutePath);

            return new ModelFilePreview
            {
                FileContent = fileContent,
                ContentType = contentType,
                FileName = fileName,
                HasWatermark = false
            };
        }

        #region Private methods
        private string GetContentType(string filePath)
        {
            var provider = new FileExtensionContentTypeProvider();
            if (provider.TryGetContentType(filePath, out var contentType))
            {
                return contentType;
            }

            return "application/octet-stream";
        }

        List<ModelAttachment> SyncUploadFile(string sourceDirPath, string destinationDirPath, string relativeDirPath = "")
        {
            try
            {
                List<ModelAttachment> lstAttachment = new List<ModelAttachment>();

                //copy file
                if (Directory.Exists(sourceDirPath))
                {
                    string[] arrFiles = Directory.GetFiles(sourceDirPath);
                    if (arrFiles.Count() > 0) //cÃ³ Ä‘Ã­nh kÃ¨m
                    {
                        //Kiá»ƒm tra náº¿u thÆ° má»¥c chÆ°a tá»“n táº¡i thÃ¬ táº¡o má»›i.
                        if (!Directory.Exists(destinationDirPath))
                        {
                            Directory.CreateDirectory(destinationDirPath);
                        }
                        //Copy file qua thÆ° má»¥c má»›i
                        foreach (string f in arrFiles)
                        {
                            FileInfo info = new FileInfo(f);
                            string tempFileName = Path.GetFileNameWithoutExtension(f); // TÃªn gá»‘c Ä‘á»ƒ lÆ°u vÃ o DB (Original name)
                            
                            // Sá»­ dá»¥ng UUID lÃ m tÃªn file váº­t lÃ½ tÄ©nh trÃªn Ä‘Ä©a Ä‘á»ƒ chá»‘ng bypass Ä‘uÃ´i vÃ  chá»‘ng ghi Ä‘Ã¨
                            string uuidFileName = Guid.NewGuid().ToString() + info.Extension;
                            string destDirPath = Path.Combine(destinationDirPath, uuidFileName);

                            //Copy file tá»›i Ä‘Æ°á»ng dáº«n má»›i (mang tÃªn UUID)
                            if (File.Exists(f))
                            {
                                File.Copy(f, destDirPath, true);
                                // LÆ°u thÃ´ng tin TÃªn Gá»‘c (FileName) vÃ  URL má»›i cho database lÆ°u trá»¯
                                ModelAttachment tepDinhKem = new ModelAttachment();
                                tepDinhKem.FileName = tempFileName;
                                tepDinhKem.FileSize = info.Length;
                                tepDinhKem.FileExtension = info.Extension;
                                tepDinhKem.FileUrl = relativeDirPath + "/" + uuidFileName; // Logical Path chá»©a UUID

                                lstAttachment.Add(tepDinhKem);
                            }
                        }
                    }
                    //XÃ³a thÆ° má»¥c táº¡m.
                    Directory.Delete(sourceDirPath, true);
                }

                return lstAttachment;
            }
            catch (Exception)
            {
                throw;
            }
        }



        #endregion
    }
}
