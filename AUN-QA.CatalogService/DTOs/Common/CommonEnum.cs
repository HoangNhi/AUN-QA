namespace AUN_QA.CatalogService.DTOs.Common
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

    public enum CouncilRole
    {
        HeadOfCouncil = 1,
        Evaluator = 2,
        EvidenceProvider = 3
    }

    public enum StandardSet_EvaluationMode
    {
        SCORING_7 = 1, // Áp dụng cho AUN-QA
        PASS_FAIL = 2 // Áp dụng cho MOET
    }
}