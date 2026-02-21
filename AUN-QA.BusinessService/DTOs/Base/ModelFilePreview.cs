namespace AUN_QA.BusinessService.DTOs.Base
{
    public class ModelFilePreview
    {
        public byte[] FileContent { get; set; } = Array.Empty<byte>();

        public string ContentType { get; set; } = "application/octet-stream";

        public string FileName { get; set; } = "download";

        public bool HasWatermark { get; set; } = false;
    }
}
