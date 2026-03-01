using AUN_QA.BusinessService.Configs;
using AUN_QA.BusinessService.Middlewares;
using AUN_QA.ServiceDefaults;

var builder = WebApplication.CreateBuilder(args);

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

app.Run();
