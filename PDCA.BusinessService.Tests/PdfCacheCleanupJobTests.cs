using AUN_QA.FileService.Services.CoreFeature.Watermark;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;

namespace AUN_QA.BusinessService.Tests;

public class PdfCacheCleanupJobTests : IDisposable
{
    private readonly string _tempRoot = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));

    private PdfCacheCleanupJob CreateSut()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PdfCache:CacheDirectoryName"] = "_office_pdf_cache",
                ["PdfCache:RetentionMonths"] = "6",
                ["PdfCache:CleanupIntervalHours"] = "24"
            })
            .Build();

        return new PdfCacheCleanupJob(config, NullLogger<PdfCacheCleanupJob>.Instance, _tempRoot);
    }

    [Fact]
    public async Task RunCleanupAsync_DeletesStaleFilesAndKeepsRecentFiles()
    {
        var cacheDir = Path.Combine(_tempRoot, "_office_pdf_cache");
        Directory.CreateDirectory(cacheDir);

        var staleFile = Path.Combine(cacheDir, "stale.pdf");
        var freshFile = Path.Combine(cacheDir, "fresh.pdf");
        await File.WriteAllBytesAsync(staleFile, new byte[] { 1 });
        await File.WriteAllBytesAsync(freshFile, new byte[] { 2 });
        File.SetLastAccessTimeUtc(staleFile, DateTime.UtcNow.AddMonths(-7));
        File.SetLastAccessTimeUtc(freshFile, DateTime.UtcNow.AddDays(-1));

        var sut = CreateSut();
        await sut.RunCleanupAsync(CancellationToken.None);

        Assert.False(File.Exists(staleFile));
        Assert.True(File.Exists(freshFile));
    }

    [Fact]
    public async Task RunCleanupAsync_ReadOnlyFileDoesNotCrashJob()
    {
        var cacheDir = Path.Combine(_tempRoot, "_office_pdf_cache");
        Directory.CreateDirectory(cacheDir);

        var staleFile = Path.Combine(cacheDir, "locked.pdf");
        await File.WriteAllBytesAsync(staleFile, new byte[] { 1 });
        File.SetLastAccessTimeUtc(staleFile, DateTime.UtcNow.AddMonths(-7));
        File.SetAttributes(staleFile, FileAttributes.ReadOnly);

        var sut = CreateSut();

        await sut.RunCleanupAsync(CancellationToken.None);

        if (File.Exists(staleFile))
        {
            File.SetAttributes(staleFile, FileAttributes.Normal);
        }
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, true);
        }
    }
}
