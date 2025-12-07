using AUN_QA.ApiGateway.Config;
using AUN_QA.ApiGateway.Middlewares;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

builder.ExecuteConfigService();

var app = builder.Build();


app.UseMiddleware<GlobalExceptionHandler>();

app.UseCors();

app.MapReverseProxy();

app.Run();