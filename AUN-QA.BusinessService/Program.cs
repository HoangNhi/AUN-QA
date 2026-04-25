using AUN_QA.BusinessService.Configs;
using AUN_QA.BusinessService.Middlewares;
using AUN_QA.BusinessService.Services.gRPC;
using AUN_QA.ServiceDefaults;
using AUN_QA.Shared.Common;
using Grpc.AspNetCore.Web;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port))
{
    builder.WebHost.UseUrls($"http://+:{port}");
}

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers(options =>
{
    options.Filters.AddService<AUN_QA.BusinessService.Infrastructure.Filters.AuditActionFilter>();
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.ExecuteConfigService();
builder.ExecuteConfigAuthentication();
builder.Services.AddTrustedForwardedHeaders(forwardLimit: 2);

var app = builder.Build();

app.UseMiddleware<GlobalExceptionHandler>();
app.UseTrustedForwardedHeaders();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.UseGrpcWeb(new GrpcWebOptions { DefaultEnabled = true });
app.MapGrpcService<BusinessGrpcService>();

app.Run();
