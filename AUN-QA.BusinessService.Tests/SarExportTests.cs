using AUN_QA.BusinessService.Services.CoreFeature.Sar;

namespace AUN_QA.BusinessService.Tests
{
    public class SarExportTests
    {
        [Fact]
        public void SanitizeListItems_RemovesParagraphInsideSingleListItem()
        {
            var input = "<ul><li><p>Hello world</p></li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ul><li>Hello world</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_RemovesParagraphWithInlineHtml()
        {
            var input = "<ul><li><p><strong>Thành viên:</strong> \"Mô tả\"</p></li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ul><li><strong>Thành viên:</strong> \"Mô tả\"</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_HandlesMultipleListItems()
        {
            var input = "<ul><li><p>First</p></li><li><p>Second</p></li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ul><li>First</li><li>Second</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_LeavesListItemsWithoutParagraphUntouched()
        {
            var input = "<ul><li>Already clean</li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ul><li>Already clean</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_LeavesStandaloneParagraphsUntouched()
        {
            var input = "<p>Normal paragraph</p><ul><li><p>Item</p></li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<p>Normal paragraph</p><ul><li>Item</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_HandlesWhitespaceAroundParagraph()
        {
            var input = "<ul><li>\n  <p>Spaced</p>\n</li></ul>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ul><li>Spaced</li></ul>", result);
        }

        [Fact]
        public void SanitizeListItems_HandlesOrderedList()
        {
            var input = "<ol><li><p>Ordered item</p></li></ol>";

            var result = HtmlWordExportHelper.SanitizeListItems(input);

            Assert.Equal("<ol><li>Ordered item</li></ol>", result);
        }

        [Fact]
        public void BuildExportHtml_ContainsWordCompatibleListCss()
        {
            var result = HtmlWordExportHelper.BuildExportHtmlDocument("<p>test</p>");

            Assert.Contains("li > p", result);
            Assert.Contains("display: inline", result);
            Assert.Contains("margin: 0", result);
            Assert.Contains("padding: 0", result);
        }
    }
}
