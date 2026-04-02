using AUN_QA.BusinessService.DTOs.Common;

namespace AUN_QA.BusinessService.Tests;

public class SarStatusContractTests
{
    [Theory]
    [InlineData(1, "Draft")]
    [InlineData(2, "Submitted")]
    [InlineData(3, "RevisionRequested")]
    [InlineData(4, "Approved")]
    public void SarStatus_maps_integer_to_name(int value, string expectedName)
    {
        var actualName = Enum.GetName(typeof(SarStatus), value);

        Assert.Equal(expectedName, actualName);
    }
}
