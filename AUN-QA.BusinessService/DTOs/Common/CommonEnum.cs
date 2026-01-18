namespace AUN_QA.BusinessService.DTOs.Common
{
    public enum ActionType
    {
        NONE = 0, //NO CHECK PERMISSION
        VIEW = 1, //GET BY, GET LIST
        ADD = 2, //INSERT, IMPORT
        UPDATE = 3, //UPDATE
        DELETE = 4, //DELETE
        APPROVE = 5, // APPROVE, NO APPROVE
        ANALYZE = 6 // EXPORT
    }

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
        HeadOfCouncil = 1,
        Evaluator = 2,
        EvidenceProvider = 3
    }
}
