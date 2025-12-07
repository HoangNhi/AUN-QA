namespace AUN_QA.AssessmentService.DTOs.Base
{
    public class BaseResponse<T>
    {
        public bool Success { get; set; } = true;
        public int StatusCode { get; set; } = 200;
        public T? Data { get; set; }
        public string? Message { get; set; }

        public BaseResponse()
        {
            Success = true;
            Message = null;
            Data = default(T);
        }

        public BaseResponse(bool success, int statuscode, T? data, string message = null)
        {
            Success = success;
            StatusCode = statuscode;
            Data = data;
            Message = message;
        }

        public BaseResponse(T data)
        {
            Success = true;
            StatusCode = 200;
            Data = data;
            Message = null;
        }
    }

    public class BaseResponse
    {
        public bool Success { get; set; } = true;
        public int StatusCode { get; set; } = 200;
        public string? Message { get; set; }

        public BaseResponse(bool success, int statuscode, string message = null)
        {
            Success = success;
            StatusCode = statuscode;
            Message = message;
        }
    }
}
