using AUN_QA.BusinessService.DTOs.CoreFeature.Sar.Dtos;

namespace AUN_QA.BusinessService.Tests;

public class SarDraftMetadataContractTests
{
    [Fact]
    public void SarDraftMetadataDto_does_not_include_heavy_document_payload_fields()
    {
        var props = typeof(SarDraftMetadataDto)
            .GetProperties()
            .Select(x => x.Name)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        Assert.DoesNotContain("YDocSnapshotBase64", props);
        Assert.DoesNotContain("RenderedHtml", props);
    }
}
