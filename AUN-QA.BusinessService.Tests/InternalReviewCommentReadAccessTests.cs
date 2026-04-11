using AUN_QA.BusinessService.DTOs.Common;

namespace AUN_QA.BusinessService.Tests;

public class InternalReviewCommentReadAccessTests
{
    private static readonly int[] AllowedReadStatuses =
    {
        (int)SarStatus.Submitted,
        (int)SarStatus.RevisionRequested,
        (int)SarStatus.Approved,
    };

    [Theory]
    [InlineData((int)SarStatus.Submitted, true)]
    [InlineData((int)SarStatus.RevisionRequested, true)]
    [InlineData((int)SarStatus.Approved, true)]
    [InlineData((int)SarStatus.Draft, false)]
    public void CommentRead_is_allowed_for_submitted_revision_and_approved_sar(int status, bool shouldAllow)
    {
        Assert.Equal(shouldAllow, AllowedReadStatuses.Contains(status));
    }

    [Theory]
    [InlineData((int)SarStatus.Submitted, true)]
    [InlineData((int)SarStatus.RevisionRequested, false)]
    [InlineData((int)SarStatus.Approved, false)]
    [InlineData((int)SarStatus.Draft, false)]
    public void CommentWrite_is_only_allowed_when_sar_is_submitted(int status, bool shouldAllow)
    {
        Assert.Equal(shouldAllow, status == (int)SarStatus.Submitted);
    }
}
