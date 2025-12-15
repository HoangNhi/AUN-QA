var builder = DistributedApplication.CreateBuilder(args);

var SystemService = builder.AddProject<Projects.AUN_QA_SystemService>("SystemService");

var CatalogService = builder.AddProject<Projects.AUN_QA_CatalogService>("CatalogService").WithReference(SystemService);

var BusinessService = builder.AddProject<Projects.AUN_QA_BusinessService>("BusinessService").WithReference(SystemService);

var gateway = builder.AddProject<Projects.AUN_QA_ApiGateway>("APIGateway")
    .WithReference(SystemService)
    .WithReference(CatalogService)
    .WithReference(BusinessService);

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "VITE_DEV_PORT", port: 5173)
    .WithExternalHttpEndpoints();

builder.Build().Run();
