using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Dtos;
using AUN_QA.BusinessService.DTOs.CoreFeature.InternalReview.Requests;
using AUN_QA.BusinessService.Helpers;
using AUN_QA.BusinessService.Services.CoreFeature.InternalReview;
using AUN_QA.Shared.Common;
using AUN_QA.Shared.DTOs.Base;
using Microsoft.AspNetCore.Mvc;

namespace AUN_QA.BusinessService.Controllers
{
    [Route("api/internal-review/comments")]
    [ApiController]
    public class InternalReviewController : BaseController<InternalReviewController>
    {
        private readonly IInternalReviewService _service;

        public InternalReviewController(IInternalReviewService service)
        {
            _service = service;
        }

        [HttpPost("get")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> GetComments([FromBody] GetInternalCommentsRequest request)
        {
            var result = await _service.GetComments(request);
            return Ok(new BaseResponse<List<InternalCommentDto>>
            {
                Data = result,
                Success = true
            });
        }

        [HttpPost("add")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> AddComment([FromBody] AddInternalCommentRequest request)
        {
            var result = await _service.AddComment(request);
            return Ok(new BaseResponse<InternalCommentDto>
            {
                Data = result,
                Success = true
            });
        }

        [HttpDelete("{id}")]
        [AttributePermission(Action = ActionType.NONE)]
        public async Task<IActionResult> DeleteComment(Guid id)
        {
            await _service.DeleteComment(new DeleteInternalCommentRequest
            {
                CommentId = id
            });

            return Ok(new BaseResponse(true, 200));
        }
    }
}
