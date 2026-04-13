using AUN_QA.FileService.DTOs.Base;
using AUN_QA.FileService.Services.CoreFeature.Watermark;
using PdfSharp.Pdf;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;

namespace AUN_QA.BusinessService.Tests;

public class DynamicWatermarkingServiceTests
{
    private readonly DynamicWatermarkingService _sut = new();

    [Fact]
    public void Apply_Pdf_ReturnsStampedBytes()
    {
        var pdfBytes = CreateMinimalPdf();
        var config = new WatermarkConfig
        {
            Text = "CONFIDENTIAL",
            Opacity = 30,
            Position = 0
        };

        var (content, hasWatermark) = _sut.Apply(pdfBytes, ".pdf", config);

        Assert.True(hasWatermark);
        Assert.NotEmpty(content);
        Assert.NotEqual(pdfBytes, content);
    }

    [Fact]
    public void Apply_Png_ReturnsStampedBytes()
    {
        var imageBytes = CreateMinimalPng();
        var config = new WatermarkConfig
        {
            Text = "WATERMARK",
            Opacity = 25,
            Position = 1
        };

        var (content, hasWatermark) = _sut.Apply(imageBytes, ".png", config);

        Assert.True(hasWatermark);
        Assert.NotEmpty(content);
    }

    [Fact]
    public void Apply_UnsupportedFormat_ReturnsOriginalBytes()
    {
        var source = new byte[] { 0x01, 0x02, 0x03 };
        var config = new WatermarkConfig
        {
            Text = "WATERMARK",
            Opacity = 25,
            Position = 0
        };

        var (content, hasWatermark) = _sut.Apply(source, ".txt", config);

        Assert.False(hasWatermark);
        Assert.Equal(source, content);
    }

    private static byte[] CreateMinimalPdf()
    {
        using var document = new PdfDocument();
        document.AddPage();
        using var ms = new MemoryStream();
        document.Save(ms);
        return ms.ToArray();
    }

    private static byte[] CreateMinimalPng()
    {
        using var image = new Image<Rgba32>(128, 128);
        using var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());
        return ms.ToArray();
    }
}
