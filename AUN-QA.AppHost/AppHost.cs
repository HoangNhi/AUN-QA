var builder = DistributedApplication.CreateBuilder(args);

var identityService = builder.AddProject<Projects.AUN_QA_IdentityService>("IdentityService");

var assessmentService = builder.AddProject<Projects.AUN_QA_AssessmentService>("AssessmentService");

var gateway = builder.AddProject<Projects.AUN_QA_ApiGateway>("APIGateway")
    .WithReference(identityService)
    .WithReference(assessmentService);

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(gateway)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
