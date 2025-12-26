var builder = DistributedApplication.CreateBuilder(args);

var systemService = builder.AddProject<Projects.AUN_QA_SystemService>("SystemService");

var catalogService = builder.AddProject<Projects.AUN_QA_CatalogService>("CatalogService").WithReference(systemService);

var businessService = builder.AddProject<Projects.AUN_QA_BusinessService>("BusinessService").WithReference(systemService);

builder.AddProject<Projects.AUN_QA_FileService>("aun-qa-fileservice");

var gateway = builder.AddProject<Projects.AUN_QA_ApiGateway>("ApiGateway")
    .WithReference(systemService)
    .WithReference(catalogService)
    .WithReference(businessService);

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "VITE_DEV_PORT", port: 5173)
    .WithExternalHttpEndpoints();


builder.Build().Run();
