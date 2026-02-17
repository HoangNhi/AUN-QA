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
        HeadOfCouncil    = 1,  // Chủ tịch HĐ    — mặc định phụ trách ALL TC (Đ15.k5a)
        ViceChairman     = 2,  // Phó Chủ tịch HĐ — Đ15.k2b
        Secretary        = 3,  // Thư ký HĐ       — không cần phân công TC
        Evaluator        = 4,  // Thành viên ĐG   — ≥3 người/TC (Đ15.k2c)
        EvidenceProvider = 5,  // Người cung cấp MC — phân công theo TC
    }

    public enum StandardSet_EvaluationMode
    {
        SCORING_7 = 1, // Áp dụng cho AUN-QA
        PASS_FAIL = 2 // Áp dụng cho MOET
    }
}