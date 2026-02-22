using AUN_QA.Shared.DTOs.Base;
using AUN_QA.FileService.Protos;
using AutoDependencyRegistration.Attributes;
using Grpc.Core;

namespace AUN_QA.BusinessService.Services.Commons.UploadFile
{
    [RegisterClassAsTransient]
    public class UploadFileService : IUploadFileService
    {
        private readonly FileProto.FileProtoClient _fileProtoClient;

        public UploadFileService(FileProto.FileProtoClient fileProtoClient)
        {
            _fileProtoClient = fileProtoClient;
        }

        public async Task<List<ModelAttachment>> UploadDataAsync(string relatedId, string folderName, string tempFolder)
        {
            try
            {
                var request = new UploadDataRequest
                {
                    RelatedId = relatedId,
                    ServicePath = "Business",
                    FolderName = folderName,
                    TempFolder = tempFolder
                };

                var response = await _fileProtoClient.UploadDataAsync(request);

                return response.Attachments.Select(x => new ModelAttachment
                {
                    Id = Guid.TryParse(x.Id, out var id) ? id : Guid.Empty,
                    ReferenceType = x.ReferenceType,
                    RelatedId = Guid.Parse(relatedId),
                    FileName = x.FileName,
                    FileExtension = x.FileExtension,
                    FileSize = x.FileSize,
                    FileUrl = x.FileUrl
                }).ToList();
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến FileService. Vui lòng thử lại sau.");
            }
        }

        public async Task<bool> DeleteDataAsync(List<string> filePaths)
        {
            try
            {
                var request = new DeleteDataRequest();
                request.FilePaths.AddRange(filePaths);
                var response = await _fileProtoClient.DeleteDataAsync(request);
                return response.Success;
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến FileService. Vui lòng thử lại sau.");
            }
        }

        public async Task<ModelFilePreview> PreviewFileAsync(string fileUrl, string mode = "internal")
        {
            try
            {
                var response = await _fileProtoClient.PreviewFileAsync(new PreviewFileRequest
                {
                    FileUrl = fileUrl,
                    Mode = mode
                });

                return new ModelFilePreview
                {
                    FileContent = response.FileContent.ToByteArray(),
                    ContentType = response.ContentType,
                    FileName = response.FileName,
                    HasWatermark = response.HasWatermark
                };
            }
            catch (RpcException)
            {
                throw new Exception("Lỗi kết nối đến FileService. Vui lòng thử lại sau.");
            }
        }
    }
}
