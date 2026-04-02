namespace AUN_QA.BusinessService.DTOs.Common
{
    public enum SurveyCampaignStatus
    {
        Draft = 1,
        Sent = 2,
        Completed = 3
    }

    public enum SurveySessionStatus
    {
        Draft = 1,
        Sent = 2,
        Completed = 3
    }

    public enum SarStatus
    {
        Draft = 1,
        Submitted = 2,
        RevisionRequested = 3,
        Approved = 4
    }

    public enum CouncilRole
    {
        HeadOfCouncil    = 1,  // CTH — Chủ tịch HĐ
        ViceChairman     = 2,  // PCT — Phó Chủ tịch HĐ
        Secretary        = 3,  // TKY — Thư ký HĐ
        Evaluator        = 4,  // TVH — Thành viên ĐG
        EvidenceProvider = 5,  // PVD — Người cung cấp MC
    }

    public enum EvidenceStatus
    {
        Draft = 1,
        Pending = 2,
        Verified = 3,
        Rejected = 4,
        Expired = 5
    }

    public enum EvidenceCycleMapReviewStatus
    {
        NotStarted = 1, InProgress = 2, Completed = 3
    }

    public enum CriterionEvaluationStatus
    {
        Empty   = 0,  // Trống — no submissions yet
        Draft   = 1,  // Nháp — (reserved, unused in current flow)
        Waiting = 2,  // Chờ duyệt — at least one submission, pending CTH approval
        Approved = 3  // Đã duyệt — CTH/PCT set official score
    }

    public enum CycleStatus
    {
        Plan   = 1,  // Lập kế hoạch
        Do     = 2,  // Thực hiện
        Check  = 3,  // Kiểm tra
        Act    = 4,  // Cải tiến
        Finish = 5   // Kết thúc
    }
}
