using AUN_QA.FileService.DTOs.Base;

namespace AUN_QA.FileService.Services.CoreFeature.Watermark
{
    public interface IDynamicWatermarkingService
    {
        (byte[] Content, bool HasWatermark) Apply(
            byte[] fileContent,
            string fileExtension,
            WatermarkConfig config);
    }
}
