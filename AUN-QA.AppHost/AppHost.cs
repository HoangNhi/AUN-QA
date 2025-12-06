var builder = DistributedApplication.CreateBuilder(args);

var identityService = builder.AddProject<Projects.AUN_QA_IdentityService>("IdentityService");

var assessmentService = builder.AddProject<Projects.AUN_QA_AssessmentService>("AssessmentService");

builder.AddNpmApp("Web", "../AUN-QA.Web", "dev")
    .WithReference(assessmentService)
    .WithReference(identityService)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
