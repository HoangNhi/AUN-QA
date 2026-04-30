namespace AUN_QA.BusinessService.Services.Background
{
    public class QueuedHostedService : BackgroundService
    {
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly IServiceProvider _serviceProvider; // Dùng để tạo Scope
        private readonly ILogger<QueuedHostedService> _logger;

        public QueuedHostedService(
            IBackgroundTaskQueue taskQueue,
            IServiceProvider serviceProvider,
            ILogger<QueuedHostedService> logger)
        {
            _taskQueue = taskQueue;
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                // 1. Lấy task ra khỏi hàng đợi
                var workItem = await _taskQueue.DequeueAsync(stoppingToken);

                try
                {
                    // 2. Tạo Scope mới cho mỗi task (Quan trọng để dùng Scoped Services như DbContext, EmailService)
                    using var scope = _serviceProvider.CreateScope();

                    // 3. Thực thi task
                    await workItem(scope.ServiceProvider, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing background work item.");
                }
            }
        }
    }
}
