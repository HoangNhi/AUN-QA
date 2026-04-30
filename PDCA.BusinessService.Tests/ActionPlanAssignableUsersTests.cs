using System.Reflection;
using System.Security.Claims;
using AUN_QA.BusinessService.DTOs.CoreFeature.ActionPlan.Dtos;
using AUN_QA.BusinessService.Infrastructure.Data;
using AUN_QA.BusinessService.Services.Commons.UploadFile;
using AUN_QA.BusinessService.Services.CoreFeature.ActionPlan;
using AUN_QA.BusinessService.Services.Integration.Catalog;
using AUN_QA.SystemService.Protos;
using AutoMapper;
using Grpc.Core;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace AUN_QA.BusinessService.Tests;

public class ActionPlanAssignableUsersTests
{
    [Fact]
    public async Task GetAssignableUsersCombobox_maps_valid_rows_and_skips_invalid_guids()
    {
        await using var context = CreateContext();
        var fakeInvoker = new FakeCallInvoker
        {
            GetActiveUsersExceptRoleHandler = excludedRoleId =>
            {
                Assert.Equal("551d1351-008e-4910-a39c-1fcdde409fdf", excludedRoleId);

                return new[]
                {
                    ("5f6d9c5e-2a62-4c34-9b8b-d1d0e2e4f101", "Nguyễn A", "na"),
                    ("7d4f8d91-9a25-41f0-8b5e-8bcf1f9c5e02", string.Empty, "user-fallback"),
                    ("not-a-guid", "Bad Row", "bad")
                };
            }
        };

        var service = CreateService(context, fakeInvoker);
        var method = typeof(ActionPlanService).GetMethod(
            "GetAssignableUsersCombobox",
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);

        var resultTask = (Task<List<AssignableMemberDto>>)method!.Invoke(service, Array.Empty<object>())!;
        var result = await resultTask;

        Assert.Equal(2, result.Count);
        Assert.Contains(result, x => x.UserId == Guid.Parse("5f6d9c5e-2a62-4c34-9b8b-d1d0e2e4f101") && x.Fullname == "Nguyễn A" && x.Username == "na");
        Assert.Contains(result, x => x.UserId == Guid.Parse("7d4f8d91-9a25-41f0-8b5e-8bcf1f9c5e02") && x.Fullname == "user-fallback" && x.Username == "user-fallback");
    }

    private static BusinessContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<BusinessContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString("N"))
            .ConfigureWarnings(warnings => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        return new BusinessContext(options);
    }

    private static ActionPlanService CreateService(BusinessContext context, FakeCallInvoker fakeInvoker)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.Name, "admin"),
                        new Claim("unique_name", "admin"),
                    },
                    authenticationType: "TestAuth"))
            }
        };

        var mapper = new Mapper(new MapperConfiguration(cfg => cfg.AddProfile(new ActionPlanProfile()), NullLoggerFactory.Instance));

        return new ActionPlanService(
            context,
            accessor,
            new SystemProto.SystemProtoClient(fakeInvoker),
            Substitute.For<IUploadFileService>(),
            mapper,
            Substitute.For<ICatalogIntegrationService>());
    }

    private sealed class FakeCallInvoker : CallInvoker
    {
        public Func<string?, IReadOnlyList<(string Id, string Fullname, string Username)>>? GetActiveUsersExceptRoleHandler { get; set; }

        public override AsyncUnaryCall<TResponse> AsyncUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
        {
            if (method.Name != "GetActiveUsersExceptRole")
            {
                throw new InvalidOperationException($"Unsupported gRPC method: {method.Name}");
            }

            var excludedRoleId = request?.GetType().GetProperty("ExcludedRoleId")?.GetValue(request) as string;
            var rows = GetActiveUsersExceptRoleHandler?.Invoke(excludedRoleId)
                ?? Array.Empty<(string Id, string Fullname, string Username)>();

            var response = CreateResponse<TResponse>(rows);

            return new AsyncUnaryCall<TResponse>(
                Task.FromResult(response),
                Task.FromResult(new Metadata()),
                () => new Status(StatusCode.OK, string.Empty),
                () => new Metadata(),
                () => { });
        }

        public override TResponse BlockingUnaryCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncClientStreamingCall<TRequest, TResponse> AsyncClientStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();

        public override AsyncServerStreamingCall<TResponse> AsyncServerStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options,
            TRequest request)
            => throw new NotSupportedException();

        public override AsyncDuplexStreamingCall<TRequest, TResponse> AsyncDuplexStreamingCall<TRequest, TResponse>(
            Method<TRequest, TResponse> method,
            string host,
            CallOptions options)
            => throw new NotSupportedException();

        private static TResponse CreateResponse<TResponse>(IReadOnlyList<(string Id, string Fullname, string Username)> rows)
            where TResponse : class
        {
            var response = Activator.CreateInstance<TResponse>()!;
            var usersProperty = typeof(TResponse).GetProperty("Users");
            Assert.NotNull(usersProperty);

            var users = usersProperty!.GetValue(response)!;
            var userType = users.GetType().GetGenericArguments().First();
            var addMethod = users.GetType().GetMethod("Add", new[] { userType });

            Assert.NotNull(addMethod);

            foreach (var row in rows)
            {
                var user = Activator.CreateInstance(userType)!;
                userType.GetProperty("Id")!.SetValue(user, row.Id);
                userType.GetProperty("Fullname")!.SetValue(user, row.Fullname);
                userType.GetProperty("Username")!.SetValue(user, row.Username);
                addMethod!.Invoke(users, new[] { user });
            }

            return response;
        }
    }
}
