using AUN_QA.SystemService.Configs;
using AUN_QA.SystemService.Middlewares;
using AUN_QA.ServiceDefaults;
using AUN_QA.SystemService.Services.SystemGrpc;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureEndpointDefaults(defaults =>
    {
        defaults.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http2;
    });
});

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddGrpc();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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

//app.UseHttpsRedirection();

app.UseCors();

app.UseAuthorization();

app.MapControllers();
app.MapGrpcService<SystemGrpcService>();

app.Run();
