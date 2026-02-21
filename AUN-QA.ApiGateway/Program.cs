using AUN_QA.ApiGateway.Configs;
using AUN_QA.ApiGateway.Middlewares;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 120 * 1024 * 1024;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 120 * 1024 * 1024;
});

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.ExecuteConfigService();

var app = builder.Build();


app.UseMiddleware<GlobalExceptionHandler>();

app.UseCors();

app.MapReverseProxy();

app.Run();