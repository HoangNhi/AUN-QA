var builder = DistributedApplication.CreateBuilder(args);

var SystemService = builder.AddProject<Projects.AUN_QA_SystemService>("SystemService");

var assessmentService = builder.AddProject<Projects.AUN_QA_AssessmentService>("AssessmentService");

var gateway = builder.AddProject<Projects.AUN_QA_ApiGateway>("APIGateway")
    .WithReference(SystemService)
    .WithReference(assessmentService);

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "VITE_DEV_PORT", port: 5173)
    .WithExternalHttpEndpoints();

builder.Build().Run();
