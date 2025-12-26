namespace AUN_QA.FileService.DTOs.Common
{
    public static class CommonConst
    {
        public static string[] _fileValid = _fileHinhAnhValid.Concat(_fileVideoValid).Concat(_fileAudioValid).Concat(_fileTaiLieuValid).ToArray();

        public static string[] _fileHinhAnhValid = new string[] { ".jpg", ".png", ".jpeg" };
        public static string _fileHinhAnhValidString = "Ảnh (jpg, png, jpeg)";

        public static string[] _fileVideoValid = new string[] { ".avi", ".wmv", ".mp4" };
        public static string _fileVideoValidString = "Video (avi, wmv, mp4)";

        public static string[] _fileAudioValid = new string[] { ".mp3", ".mp4", ".wma", ".wav", ".m4a" };
        public static string _fileAudioValidString = "Audio (mp3, mp4, wma, wav, m4a)";

        public static string[] _fileTaiLieuValid = new string[] { ".pdf", ".doc", ".docx", ".xls", ".xlsx" };
        public static string _fileTaiLieuValidString = "PDF, Văn bản (doc, docx, xls, xlsx)";

        public static string[] _fileTaiLieuImportValid = new string[] { ".doc", ".docx", ".xls", ".xlsx" };
        public static string _fileTaiLieuImportValidString = "Văn bản (doc, docx, xls, xlsx)";
    }
}
