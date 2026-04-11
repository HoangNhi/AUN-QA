using System.Text.RegularExpressions;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar;

public static class HtmlWordExportHelper
{
    private static readonly Regex ListItemParagraphRegex =
        new(@"(<li\b[^>]*>)\s*<p\b[^>]*>(.*?)</p>\s*</li>", RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private static readonly Regex ImgSrcRegex =
        new(@"<img\b[^>]*\bsrc\s*=\s*([""'])(?<src>[^""']+)\1[^>]*/?>", RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static string SanitizeListItems(string html)
    {
        ArgumentNullException.ThrowIfNull(html);

        return ListItemParagraphRegex.Replace(html, "$1$2</li>");
    }

    public static string BuildExportHtmlDocument(string renderedHtml)
    {
        ArgumentNullException.ThrowIfNull(renderedHtml);

        var sanitizedHtml = SanitizeListItems(renderedHtml);

        if (sanitizedHtml.Contains("<html", StringComparison.OrdinalIgnoreCase))
        {
            return sanitizedHtml;
        }

        return $@"<!doctype html>
<html>
<head>
  <meta charset=""utf-8"" />
  <style>
    body {{ font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }}
    li > p {{ display: inline; margin: 0; padding: 0; }}
    table {{ border-collapse: collapse; width: 100%; }}
    th, td {{ border: 1px solid #999; padding: 4px; vertical-align: top; }}
    img {{ max-width: 100%; height: auto; }}
    [data-type='evidence-tag'] {{ border: 1px solid #CBD5E1; border-radius: 4px; padding: 0 4px; }}
  </style>
</head>
<body>
  {sanitizedHtml}
</body>
</html>";
    }

    public static async Task<string> EmbedImagesAsBase64Async(
        string html,
        HttpClient httpClient,
        string serverBaseUrl)
    {
        ArgumentNullException.ThrowIfNull(html);
        ArgumentNullException.ThrowIfNull(httpClient);

        var matches = ImgSrcRegex.Matches(html);
        if (matches.Count == 0)
        {
            return html;
        }

        var baseUrl = serverBaseUrl.Trim();
        var uniqueSources = matches
            .Select(match => match.Groups["src"].Value.Trim())
            .Where(src =>
                !string.IsNullOrWhiteSpace(src) &&
                !src.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (uniqueSources.Count == 0)
        {
            return html;
        }

        var replacements = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        foreach (var src in uniqueSources)
        {
            try
            {
                var absoluteUri =
                    Uri.TryCreate(src, UriKind.Absolute, out var directUri)
                        ? directUri
                        : !string.IsNullOrWhiteSpace(baseUrl)
                            ? new Uri(new Uri(baseUrl.TrimEnd('/') + "/"), src.TrimStart('/'))
                            : null;

                if (absoluteUri is null)
                {
                    continue;
                }

                var response = await httpClient.GetAsync(absoluteUri);
                if (!response.IsSuccessStatusCode)
                {
                    continue;
                }

                var bytes = await response.Content.ReadAsByteArrayAsync();
                if (bytes.Length == 0)
                {
                    continue;
                }

                var mimeType = response.Content.Headers.ContentType?.MediaType ?? "image/png";
                replacements[src] = $"data:{mimeType};base64,{Convert.ToBase64String(bytes)}";
            }
            catch
            {
                // Leave the original src intact if the image cannot be fetched.
            }
        }

        if (replacements.Count == 0)
        {
            return html;
        }

        return ImgSrcRegex.Replace(html, match =>
        {
            var src = match.Groups["src"].Value.Trim();
            if (!replacements.TryGetValue(src, out var dataUri))
            {
                return match.Value;
            }

            var quote = match.Groups[1].Value;
            return match.Value.Replace($"{quote}{src}{quote}", $"{quote}{dataUri}{quote}");
        });
    }
}
