using AUN_QA.FileService.Services.CoreFeature.Watermark;
using AUN_QA.Shared.Exceptions;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AUN_QA.BusinessService.Tests;

public class OfficeConversionServiceTests : IDisposable
{
    private readonly string _tempRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));

    private OfficeConversionService CreateSut()
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PdfCache:CacheDirectoryName"] = "_office_pdf_cache",
                ["PdfCache:ConversionTimeoutSeconds"] = "2"
            })
            .Build();

        return new OfficeConversionService(cache, config, NullLogger<OfficeConversionService>.Instance, _tempRoot);
    }

    [Fact]
    public async Task ConvertToPdfAsync_CacheHit_ReturnsCachedBytes()
    {
        var sut = CreateSut();
        var fileId = Guid.NewGuid();
        var cacheDir = Path.Combine(_tempRoot, "_office_pdf_cache");
        Directory.CreateDirectory(cacheDir);

        var cachedPath = Path.Combine(cacheDir, $"{fileId}_converted.pdf");
        var cachedBytes = new byte[] { 0x25, 0x50, 0x44, 0x46 };
        await File.WriteAllBytesAsync(cachedPath, cachedBytes);

        var originalAccessTime = DateTime.UtcNow.AddHours(-1);
        File.SetLastAccessTimeUtc(cachedPath, originalAccessTime);

        var result = await sut.ConvertToPdfAsync("/fake/path/file.docx", fileId);

        Assert.Equal(cachedBytes, result);
        Assert.True(File.GetLastAccessTimeUtc(cachedPath) > originalAccessTime);
    }

    [Fact]
    public async Task ConvertToPdfAsync_EmptyFileId_ThrowsBusinessException()
    {
        var sut = CreateSut();

        await Assert.ThrowsAsync<BusinessException>(
            () => sut.ConvertToPdfAsync("/fake/path/file.docx", Guid.Empty));
    }

    [Fact]
    public async Task ConvertToPdfAsync_LibreOfficeUnavailable_ThrowsBusinessException()
    {
        var sut = CreateSut();
        var fileId = Guid.NewGuid();
        var sourcePath = Path.Combine(_tempRoot, "sample.docx");
        await File.WriteAllBytesAsync(sourcePath, new byte[] { 0x50, 0x4B });

        await Assert.ThrowsAsync<BusinessException>(
            () => sut.ConvertToPdfAsync(sourcePath, fileId));
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, true);
        }
    }
}
