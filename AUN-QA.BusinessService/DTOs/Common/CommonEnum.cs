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
        HeadOfCouncil = 1,
        ViceChairman = 2,
        Secretary = 3,
        Evaluator = 4,
        EvidenceProvider = 5,
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
        NotStarted = 1,
        InProgress = 2,
        Completed = 3
    }

    public enum CriterionEvaluationStatus
    {
        Empty = 0,
        Draft = 1,
        Waiting = 2,
        Approved = 3
    }

    public enum CycleStatus
    {
        Plan = 1,
        Do = 2,
        Check = 3,
        Act = 4,
        Finish = 5
    }

    public enum ExternalReviewStatus
    {
        New = 0,
        InProgress = 1,
        Completed = 2
    }

    public enum FindingType
    {
        Improve = 0,
        Recommendation = 1
    }

    public enum WatermarkPosition
    {
        Diagonal = 0,
        Center = 1,
        Repeat = 2
    }

    public enum ActionPlanStatus
    {
        Draft = 1,
        Submitted = 2,
        RevisionRequested = 3,
        Approved = 4,
        Assigned = 5
    }

    public enum ActionPriority
    {
        High = 1,
        Medium = 2,
        Low = 3
    }

    public enum ActionTaskStatus
    {
        Todo = 1,
        InProgress = 2,
        Done = 3
    }
}
