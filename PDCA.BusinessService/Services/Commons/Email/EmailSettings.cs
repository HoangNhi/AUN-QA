namespace AUN_QA.BusinessService.Services.Commons.Email
{
    public class EmailSettings
    {
        public string Host { get; set; }
        public int Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string FromEmail { get; set; }
        public string DisplayName { get; set; }
        public bool EnableSsl { get; set; }
    }
}
