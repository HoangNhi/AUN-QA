using AUN_QA.FileService.Services.CoreFeature.Watermark.Fonts;

namespace AUN_QA.BusinessService.Tests;

public class TimesNewRomanFontResolverTests
{
    [Fact]
    public void ResolveTypeface_UsesTimesNewRoman_WhenAllTimesFacesExist()
    {
        using var fixture = new TempFontFixture();
        fixture.Write("Times_New_Roman.ttf", new byte[] { 1 });
        fixture.Write("Times_New_Roman_Bold.ttf", new byte[] { 2 });
        fixture.Write("Times_New_Roman_Italic.ttf", new byte[] { 3 });
        fixture.Write("Times_New_Roman_Bold_Italic.ttf", new byte[] { 4 });

        var sut = new TimesNewRomanFontResolver(new[] { fixture.RootPath });

        var regular = sut.ResolveTypeface("Times New Roman", bold: false, italic: false);
        var bold = sut.ResolveTypeface("Times New Roman", bold: true, italic: false);
        var italic = sut.ResolveTypeface("Times New Roman", bold: false, italic: true);
        var boldItalic = sut.ResolveTypeface("Times New Roman", bold: true, italic: true);

        Assert.NotNull(regular);
        Assert.NotNull(bold);
        Assert.NotNull(italic);
        Assert.NotNull(boldItalic);

        Assert.Equal(new byte[] { 1 }, sut.GetFont(regular!.FaceName));
        Assert.Equal(new byte[] { 2 }, sut.GetFont(bold!.FaceName));
        Assert.Equal(new byte[] { 3 }, sut.GetFont(italic!.FaceName));
        Assert.Equal(new byte[] { 4 }, sut.GetFont(boldItalic!.FaceName));
    }

    [Fact]
    public void ResolveTypeface_FallsBackToLiberationSerif_WhenTimesMissing()
    {
        using var fixture = new TempFontFixture();
        fixture.Write("LiberationSerif-Regular.ttf", new byte[] { 10 });
        fixture.Write("LiberationSerif-Bold.ttf", new byte[] { 20 });
        fixture.Write("LiberationSerif-Italic.ttf", new byte[] { 30 });
        fixture.Write("LiberationSerif-BoldItalic.ttf", new byte[] { 40 });

        var sut = new TimesNewRomanFontResolver(new[] { fixture.RootPath });

        var info = sut.ResolveTypeface("Times New Roman", bold: true, italic: false);

        Assert.NotNull(info);
        Assert.Equal(new byte[] { 20 }, sut.GetFont(info!.FaceName));
    }

    [Fact]
    public void ResolveTypeface_FallsBackToDejaVuSerif_WhenTimesAndLiberationMissing()
    {
        using var fixture = new TempFontFixture();
        fixture.Write("DejaVuSerif.ttf", new byte[] { 100 });
        fixture.Write("DejaVuSerif-Bold.ttf", new byte[] { 110 });
        fixture.Write("DejaVuSerif-Italic.ttf", new byte[] { 120 });
        fixture.Write("DejaVuSerif-BoldItalic.ttf", new byte[] { 130 });

        var sut = new TimesNewRomanFontResolver(new[] { fixture.RootPath });

        var info = sut.ResolveTypeface("Times New Roman", bold: false, italic: true);

        Assert.NotNull(info);
        Assert.Equal(new byte[] { 120 }, sut.GetFont(info!.FaceName));
    }

    [Fact]
    public void Constructor_Throws_WhenNoSupportedSerifFontsFound()
    {
        using var fixture = new TempFontFixture();

        Assert.Throws<InvalidOperationException>(
            () => new TimesNewRomanFontResolver(new[] { fixture.RootPath }));
    }

    private sealed class TempFontFixture : IDisposable
    {
        public string RootPath { get; } = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString("N"));

        public TempFontFixture()
        {
            Directory.CreateDirectory(RootPath);
        }

        public void Write(string fileName, byte[] content)
        {
            File.WriteAllBytes(Path.Combine(RootPath, fileName), content);
        }

        public void Dispose()
        {
            if (Directory.Exists(RootPath))
            {
                Directory.Delete(RootPath, true);
            }
        }
    }
}
