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
}
