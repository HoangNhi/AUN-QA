using AUN_QA.FileService.DTOs.Base;
using AUN_QA.FileService.Services.UploadFile;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.FileService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UploadFileController : BaseController<UploadFileController>
    {
        IUploadFileService _service;

        public UploadFileController(IUploadFileService service)
        {
            _service = service;
        }

        [HttpPost]
        [DisableRequestSizeLimit]
        [RequestFormLimits(ValueLengthLimit = int.MaxValue, MultipartBodyLengthLimit = long.MaxValue)]
        public async Task<IActionResult> Post(List<IFormFile> files, [FromForm] string FolderName)
        {
            await _service.Insert(files, FolderName);
            return Ok(new BaseResponse(true, 200));
        }
    }
}
