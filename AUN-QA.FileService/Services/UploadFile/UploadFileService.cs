using AUN_QA.FileService.DTOs.Base;
using AUN_QA.FileService.DTOs.Common;
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
                    throw new Exception("Upload file không thành công");
                }
            }
        }

        public List<ModelAttachment> UploadData(object lienKetId, string servicePath, string folderName, string tempFolder)
        {
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

        List<ModelAttachment> SyncUploadFile(string sourceDirPath, string destinationDirPath, string relativeDirPath = "")
        {
            try
            {
                List<ModelAttachment> lstAttachment = new List<ModelAttachment>();

                //copy file
                if (Directory.Exists(sourceDirPath))
                {
                    string[] arrFiles = Directory.GetFiles(sourceDirPath);
                    if (arrFiles.Count() > 0) //có đính kèm
                    {
                        //Kiểm tra nếu thư mục chưa tồn tại thì tạo mới.
                        if (!Directory.Exists(destinationDirPath))
                        {
                            Directory.CreateDirectory(destinationDirPath);
                        }
                        //Copy file qua thư mục mới
                        foreach (string f in arrFiles)
                        {
                            FileInfo info = new FileInfo(f);
                            //Kiểm tra nếu file tồn tại thì thêm số đánh dấu: file(1).pdf
                            string tempFileName = Path.GetFileNameWithoutExtension(f);
                            //Bỏ ký tự đặc biệt
                            tempFileName = RemoveSign(tempFileName);
                            //Bỏ ký tự tiếng việt
                            tempFileName = RemoveSign4VietnameseString(tempFileName);

                            bool isLoop = true;
                            int counter = 0;
                            while (isLoop)
                            {
                                string tempFileNameWithExtension = tempFileName + info.Extension;
                                string tempFilePath = Path.Combine(destinationDirPath, tempFileNameWithExtension);
                                //Nếu tên file đã tồn tại thì tạo tên file mới.
                                if (File.Exists(tempFilePath))
                                {
                                    counter += 1;
                                    tempFileName = Path.GetFileNameWithoutExtension(f) + "(" + counter.ToString() + ")"; //new name
                                }
                                else
                                    isLoop = false;

                            }
                            //Xác định destFileName   
                            if (counter <= 0)
                            {
                                tempFileName = Path.GetFileNameWithoutExtension(f);
                                //Bỏ ký tự đặc biệt
                                tempFileName = RemoveSign(tempFileName);
                                //Bỏ ký tự tiếng việt
                                tempFileName = RemoveSign4VietnameseString(tempFileName);
                            }

                            string destDirPath = Path.Combine(destinationDirPath, tempFileName + info.Extension);

                            //Copy file
                            if (File.Exists(f))
                            {
                                File.Copy(f, destDirPath, true);
                                //Lấy thông tin file.
                                ModelAttachment tepDinhKem = new ModelAttachment();
                                tepDinhKem.FileName = tempFileName;
                                tepDinhKem.FileSize = info.Length;
                                tepDinhKem.FileExtension = info.Extension;
                                tepDinhKem.FileUrl = relativeDirPath + "/" + tepDinhKem.FileName + tepDinhKem.FileExtension;

                                lstAttachment.Add(tepDinhKem);
                            }
                        }
                    }
                    //Xóa thư mục tạm.
                    Directory.Delete(sourceDirPath, true);
                }

                return lstAttachment;
            }
            catch (Exception ex)
            {
                throw ex;
            }
        }

        string[] VietnameseSigns = new string[]
        {

            "aAeEoOuUiIdDyY",

            "áàạảãâấầậẩẫăắằặẳẵ",

            "ÁÀẠẢÃÂẤẦẬẨẪĂẮẰẶẲẴ",

            "éèẹẻẽêếềệểễ",

            "ÉÈẸẺẼÊẾỀỆỂỄ",

            "óòọỏõôốồộổỗơớờợởỡ",

            "ÓÒỌỎÕÔỐỒỘỔỖƠỚỜỢỞỠ",

            "úùụủũưứừựửữ",

            "ÚÙỤỦŨƯỨỪỰỬỮ",

            "íìịỉĩ",

            "ÍÌỊỈĨ",

            "đ",

            "Đ",

            "ýỳỵỷỹ",

            "ÝỲỴỶỸ"
        };

        string RemoveSign4VietnameseString(string str)
        {
            for (int i = 1; i < VietnameseSigns.Length; i++)
            {
                for (int j = 0; j < VietnameseSigns[i].Length; j++)
                    str = str.Replace(VietnameseSigns[i][j], VietnameseSigns[0][i - 1]);
            }
            return str;
        }

        string RemoveSign(string input)
        {
            string[] strS = { "'", "~", "@", "#", "%", "^", "&", "`", "../", "\\", ":", "*", "?", "<", ">", "|", ",", "-", "+" };
            int iSeek = 0;
            for (int i = 0; i <= strS.Length - 1; i++)
            {
                iSeek = input.IndexOf(strS[i]);
                if (iSeek != -1)
                {
                    input = input.Replace(input.Substring(input.IndexOf(strS[i]), 1), "_");
                }
            }

            return input;
        }
    }
}
