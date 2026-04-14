using AUN_QA.FileService.Services.CoreFeature.Watermark;
using AUN_QA.FileService.DTOs.Base;
using NSubstitute;
using PdfSharp.Pdf;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;

namespace AUN_QA.BusinessService.Tests;

public class DynamicWatermarkingServiceTests
{
    private readonly IOfficeConversionService _officeConversionService = Substitute.For<IOfficeConversionService>();
    private readonly DynamicWatermarkingService _sut;

    public DynamicWatermarkingServiceTests()
    {
        _sut = new DynamicWatermarkingService(_officeConversionService);
    }

    [Fact]
    public async Task ApplyAsync_Pdf_ReturnsStampedBytes()
    {
        var pdfBytes = CreateMinimalPdf();
        var config = new WatermarkConfig
        {
            Text = "CONFIDENTIAL",
            Opacity = 30,
            Position = 0
        };

        var (content, contentType, hasWatermark) = await _sut.ApplyAsync(
            pdfBytes,
            ".pdf",
            Guid.NewGuid(),
            "/tmp/sample.pdf",
            config);

        Assert.True(hasWatermark);
        Assert.Equal("application/pdf", contentType);
        Assert.NotEmpty(content);
        Assert.NotEqual(pdfBytes, content);
    }

    [Fact]
    public async Task ApplyAsync_Pdf_WithVietnameseWatermarkText_ReturnsStampedBytes()
    {
        var pdfBytes = CreateMinimalPdf();
        var config = new WatermarkConfig
        {
            Text = "Đánh giá ngoài - Trường đại học chất lượng cao (Tiếng Việt có dấu)",
            Opacity = 30,
            Position = 0
        };

        var (content, contentType, hasWatermark) = await _sut.ApplyAsync(
            pdfBytes,
            ".pdf",
            Guid.NewGuid(),
            "/tmp/sample.pdf",
            config);

        Assert.True(hasWatermark);
        Assert.Equal("application/pdf", contentType);
        Assert.NotEmpty(content);
        Assert.NotEqual(pdfBytes, content);
    }

    [Fact]
    public async Task ApplyAsync_Png_ReturnsStampedBytes()
    {
        var imageBytes = CreateMinimalPng();
        var config = new WatermarkConfig
        {
            Text = "WATERMARK",
            Opacity = 25,
            Position = 1
        };

        var (content, contentType, hasWatermark) = await _sut.ApplyAsync(
            imageBytes,
            ".png",
            Guid.NewGuid(),
            "/tmp/sample.png",
            config);

        Assert.True(hasWatermark);
        Assert.Equal("image/png", contentType);
        Assert.NotEmpty(content);
    }

    [Fact]
    public async Task ApplyAsync_OfficeDoc_UsesOfficeConversionService()
    {
        var fileId = Guid.NewGuid();
        var officeBytes = new byte[] { 0x50, 0x4B, 0x03, 0x04 };
        var convertedPdfBytes = CreateMinimalPdf();
        var config = new WatermarkConfig
        {
            Text = "CONFIDENTIAL",
            Opacity = 25,
            Position = 0
        };

        _officeConversionService
            .ConvertToPdfAsync("/tmp/sample.docx", fileId, Arg.Any<CancellationToken>())
            .Returns(Task.FromResult(convertedPdfBytes));

        var (content, contentType, hasWatermark) = await _sut.ApplyAsync(
            officeBytes,
            ".docx",
            fileId,
            "/tmp/sample.docx",
            config);

        await _officeConversionService.Received(1).ConvertToPdfAsync(
            "/tmp/sample.docx",
            fileId,
            Arg.Any<CancellationToken>());

        Assert.True(hasWatermark);
        Assert.Equal("application/pdf", contentType);
        Assert.NotEmpty(content);
        Assert.NotEqual(officeBytes, content);
    }

    [Fact]
    public async Task ApplyAsync_UnsupportedFormat_ReturnsOriginalBytes()
    {
        var source = new byte[] { 0x01, 0x02, 0x03 };
        var config = new WatermarkConfig
        {
            Text = "WATERMARK",
            Opacity = 25,
            Position = 0
        };

        var (content, contentType, hasWatermark) = await _sut.ApplyAsync(
            source,
            ".txt",
            null,
            "/tmp/sample.txt",
            config);

        Assert.False(hasWatermark);
        Assert.Equal(source, content);
        Assert.Equal("text/plain", contentType);
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
