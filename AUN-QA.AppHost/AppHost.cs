var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.AUN_QA_IdentityService>("aun-qa-identityservice");

builder.Build().Run();
