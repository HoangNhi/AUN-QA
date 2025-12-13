namespace AUN_QA.SystemService.DTOs.Base
{
    public class MODELCombobox
    {
        public string? Text { get; set; } = string.Empty;
        public string? Value { get; set; } = string.Empty;
        public int? Sort { get; set; }
        public string? Parent { get; set; }
        public bool IsSelected { get; set; } = false;
    }
}
