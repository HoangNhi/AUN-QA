using AUN_QA.Shared.DTOs.Base;
using AUN_QA.BusinessService.DTOs.Common;
using AUN_QA.Shared.Common;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Background;
using AUN_QA.BusinessService.Services.Commons.Email;
using AUN_QA.CatalogService.Protos;
using AUN_QA.FileService.Protos;
using AUN_QA.SystemService.Protos;
using AutoDependencyRegistration;
using AutoMapper;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Configs
{
    public static class ConfigService
    {
        public static void ExecuteConfigService(this WebApplicationBuilder builder)
        {
            //SYSTEM
            builder.WebHost.ConfigureKestrel(options =>
            {
                options.ConfigureEndpointDefaults(defaults =>
                {
                    defaults.Protocols = Microsoft.AspNetCore.Server.Kestrel.Core.HttpProtocols.Http1AndHttp2;
                });
            });
            builder.Services.AddSingleton(builder.Configuration);
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            // Audit interceptor + action filter
            builder.Services.AddScoped<AUN_QA.BusinessService.Infrastructure.Interceptors.AuditInterceptor>();
            builder.Services.AddScoped<AUN_QA.BusinessService.Infrastructure.Filters.AuditActionFilter>();

            //DATABASE
            builder.Services.AddDbContext<BusinessContext>((sp, options) =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("Business"))
                       .AddInterceptors(sp.GetRequiredService<AUN_QA.BusinessService.Infrastructure.Interceptors.AuditInterceptor>()));

            //MAPPER
            builder.Services.AddAutoMapper(mc =>
            {
                mc.AddMaps(typeof(ConfigService).Assembly);
                mc.CreateMap<DateOnly?, DateTime?>().ConvertUsing(new DateTimeTypeConverter());
                mc.CreateMap<DateTime?, DateOnly?>().ConvertUsing(new DateOnlyTypeConverter());
            });

            //FLUENT
            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var errorMsg = CommonFunc.GetModelStateAPI(context.ModelState);
                    return new OkObjectResult(new BaseResponse(false, 400, errorMsg));
                };
            });
            builder.Services.AddMvc()
                .AddFluentValidation(config =>
                {
                    config.ImplicitlyValidateChildProperties = true;
                    config.DisableDataAnnotationsValidation = true;
                    config.RegisterValidatorsFromAssemblyContaining<GetByIdDeleteRequestValidator>();
                })
                .AddJsonOptions(options => options.JsonSerializerOptions.PropertyNamingPolicy = null);

            //ALL SERVICE
            builder.Services.AutoRegisterDependencies();
            builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
            builder.Services.AddSingleton<IBackgroundTaskQueue>(ctx => new BackgroundTaskQueue(1000));
            builder.Services.AddHostedService<QueuedHostedService>();

            //CORS
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(
                    policy =>
                    {
                        var origin = builder.Configuration.GetSection("Cors:Origins").Get<string[]>();
                        if (origin != null && origin.Length > 0)
                        {
                            policy.WithOrigins(origin)
                                  .AllowAnyHeader()
                                  .AllowAnyMethod();
                        }
                    });
            });

            //GRPC CLIENT
            builder.Services.AddTransient<AUN_QA.Shared.Common.GrpcJwtInterceptor>();

            builder.Services.AddGrpcClient<SystemProto.SystemProtoClient>(o =>
            {
                o.Address = new Uri("http://SystemService");
            })
            .AddInterceptor<AUN_QA.Shared.Common.GrpcJwtInterceptor>();

            builder.Services.AddGrpcClient<AuditProto.AuditProtoClient>(o =>
            {
                o.Address = new Uri("http://SystemService");
            })
            .AddInterceptor<AUN_QA.Shared.Common.GrpcJwtInterceptor>();

            const int grpcMaxMessageSize = 128 * 1024 * 1024; // 128 MB

            builder.Services.AddGrpcClient<FileProto.FileProtoClient>(o =>
            {
                o.Address = new Uri("http://FileService");
            })
            .ConfigureChannel(o =>
            {
                o.MaxReceiveMessageSize = grpcMaxMessageSize;
                o.MaxSendMessageSize = grpcMaxMessageSize;
            })
            .AddInterceptor<AUN_QA.Shared.Common.GrpcJwtInterceptor>();

            builder.Services.AddGrpcClient<CatalogProto.CatalogProtoClient>(o =>
            {
                o.Address = new Uri("http://CatalogService");
            })
            .AddInterceptor<AUN_QA.Shared.Common.GrpcJwtInterceptor>();
        }

        public class DateTimeTypeConverter : ITypeConverter<DateOnly?, DateTime?>
        {
            public DateTime? Convert(DateOnly? source, DateTime? destination, ResolutionContext context)
            {
                return source.HasValue ? source.Value.ToDateTime(TimeOnly.Parse("00:00:00")) : null;
            }
        }

        public class DateOnlyTypeConverter : ITypeConverter<DateTime?, DateOnly?>
        {
            public DateOnly? Convert(DateTime? source, DateOnly? destination, ResolutionContext context)
            {
                return source.HasValue ? DateOnly.FromDateTime(source.Value) : null;
            }
        }
    }
}
