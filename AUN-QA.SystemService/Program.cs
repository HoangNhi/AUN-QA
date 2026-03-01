using AUN_QA.ServiceDefaults;
using AUN_QA.SystemService.Configs;
using AUN_QA.SystemService.Middlewares;
using AUN_QA.SystemService.Services.SystemGrpc;
using Microsoft.AspNetCore.Server.Kestrel.Core;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

// Add services to the container.

builder.Services.AddControllers(options =>
{
    options.Filters.AddService<AUN_QA.SystemService.Infrastructure.Filters.AuditActionFilter>();
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureEndpointDefaults(lo => lo.Protocols = HttpProtocols.Http1AndHttp2);
});

builder.ExecuteConfigService();
builder.ExecuteConfigAuthentication();

var app = builder.Build();

app.UseMiddleware<GlobalExceptionHandler>();

app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGrpcService<SystemGrpcService>();
app.MapGrpcService<AUN_QA.SystemService.Services.GrpcService.AuditGrpcService>();

app.Run();
