using AUN_QA.BusinessService.DTOs.Base;
using AUN_QA.BusinessService.Infrastructure.Data;
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
            builder.Services.AddSingleton(builder.Configuration);
            builder.Services.AddHttpContextAccessor();
            builder.Services.AddSingleton<IHttpContextAccessor, HttpContextAccessor>();

            //DATABASE
            builder.Services.AddDbContext<BusinessContext>(options =>
                options.UseSqlServer(builder.Configuration.GetConnectionString("Business")
            ));

            //MAPPER
            using var serviceProvider = builder.Services.BuildServiceProvider();
            var loggerFactory = serviceProvider.GetRequiredService<ILoggerFactory>();

            var mappingConfig = new MapperConfiguration(mc =>
            {
                mc.AddMaps(AppDomain.CurrentDomain.GetAssemblies());
                mc.CreateMap<DateOnly?, DateTime?>().ConvertUsing(new DateTimeTypeConverter());
                mc.CreateMap<DateTime?, DateOnly?>().ConvertUsing(new DateOnlyTypeConverter());
            }, loggerFactory);
            IMapper mapper = mappingConfig.CreateMapper();
            builder.Services.AddSingleton(mapper);

            //FLUENT
            builder.Services.Configure<ApiBehaviorOptions>(options =>
            {
                options.SuppressModelStateInvalidFilter = true;
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

            builder.Services.AddGrpcClient<SystemProto.SystemProtoClient>(o =>
            {
                o.Address = new Uri("http://SystemService");
            });
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
