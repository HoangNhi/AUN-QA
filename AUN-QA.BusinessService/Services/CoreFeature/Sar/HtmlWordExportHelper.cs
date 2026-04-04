using System.Text.RegularExpressions;

namespace AUN_QA.BusinessService.Services.CoreFeature.Sar;

public static class HtmlWordExportHelper
{
    private static readonly Regex ListItemParagraphRegex =
        new(@"(<li\b[^>]*>)\s*<p\b[^>]*>(.*?)</p>\s*</li>", RegexOptions.Singleline | RegexOptions.IgnoreCase | RegexOptions.Compiled);

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
}
