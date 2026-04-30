using AUN_QA.BusinessService.DTOs.Common;

namespace AUN_QA.BusinessService.Tests;

public class SarCycleListVisibilityTests
{
    private static readonly int[] AllowedCycleStatuses =
    {
        (int)CycleStatus.Do,
        (int)CycleStatus.Check,
        (int)CycleStatus.Act,
    };

    [Theory]
    [InlineData((int)CycleStatus.Plan, false)]
    [InlineData((int)CycleStatus.Do, true)]
    [InlineData((int)CycleStatus.Check, true)]
    [InlineData((int)CycleStatus.Act, true)]
    [InlineData((int)CycleStatus.Finish, false)]
    public void SarList_only_shows_cycles_in_do_check_act_phases(int status, bool shouldShow)
    {
        Assert.Equal(shouldShow, AllowedCycleStatuses.Contains(status));
    }
}
