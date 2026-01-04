var builder = DistributedApplication.CreateBuilder(args);

var fileService = builder.AddProject<Projects.AUN_QA_FileService>("FileService");

var systemService = builder
    .AddProject<Projects.AUN_QA_SystemService>("SystemService")
    .WithReference(fileService);

var catalogService = builder.AddProject<Projects.AUN_QA_CatalogService>("CatalogService")
    .WithReference(systemService)
    .WithReference(fileService);

var businessService = builder.AddProject<Projects.AUN_QA_BusinessService>("BusinessService")
    .WithReference(systemService)
    .WithReference(fileService)
    .WithReference(catalogService);

var gateway = builder.AddProject<Projects.AUN_QA_ApiGateway>("ApiGateway")
    .WithReference(systemService)
    .WithReference(catalogService)
    .WithReference(businessService)
    .WithReference(fileService);

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "VITE_DEV_PORT", port: 5173)
    .WithExternalHttpEndpoints();


builder.Build().Run();
