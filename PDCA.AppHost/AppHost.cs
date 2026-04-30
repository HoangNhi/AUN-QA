var builder = DistributedApplication.CreateBuilder(args);

var fileService = builder.AddProject<Projects.PDCA_FileService>("FileService");

var systemService = builder
    .AddProject<Projects.PDCA_SystemService>("SystemService")
    .WithReference(fileService);

fileService.WithReference(systemService);

var catalogService = builder.AddProject<Projects.PDCA_CatalogService>("CatalogService")
    .WithReference(systemService)
    .WithReference(fileService);

builder.AddNpmApp("CollabService", "../PDCA.CollabService", "dev")
    .WithHttpEndpoint(env: "PORT", port: 1234)
    .WithExternalHttpEndpoints();

var businessService = builder.AddProject<Projects.PDCA_BusinessService>("BusinessService")
    .WithReference(systemService)
    .WithReference(fileService)
    .WithReference(catalogService);

systemService.WithReference(businessService);

var gateway = builder.AddProject<Projects.PDCA_ApiGateway>("ApiGateway")
    .WithReference(systemService)
    .WithReference(catalogService)
    .WithReference(businessService)
    .WithReference(fileService);

builder.AddNpmApp("Web", "../PDCA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "VITE_DEV_PORT", port: 5173)
    .WithExternalHttpEndpoints();


builder.Build().Run();
