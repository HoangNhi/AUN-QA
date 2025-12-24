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
}
