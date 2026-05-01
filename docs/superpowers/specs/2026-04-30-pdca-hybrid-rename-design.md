# PDCA Hybrid Rename Design

Status: Approved for specification on 2026-04-30

## Context

The repository was originally named around AUN-QA because the first implementation focus was AUN-QA quality assurance. After the platform evolved, its core value is better described as a PDCA workflow platform for quality assurance management. The product supports multiple evaluation standards, including AUN-QA and MOET, so the rename must separate the project identity from the domain standards it supports.

## Goals

- Rebrand the project identity inside the repository from `AUN-QA` / `aun-qa` to `PDCA` / `pdca`.
- Keep the local repository root folder unchanged for this phase: `D:\Workspace\Personal\AUN-QA`.
- Preserve AUN-QA and MOET as supported quality assurance standards in domain models, user-facing standard names, documentation content, and business workflows.
- Keep the rename focused enough to verify with build and test commands before returning to README writing.
- Defer the English recruiter-facing README rewrite until the rename has completed successfully.

## Non-Goals

- Do not rename the local root folder in this phase.
- Do not rewrite the README content in this phase.
- Do not remove AUN-QA or MOET from the product domain.
- Do not change database schema semantics or quality assurance workflow behavior.
- Do not perform a full C# namespace migration from `AUN_QA.*` to `PDCA.*` in this first phase.

## Rename Strategy

Use a hybrid rename. Public project identity and repository-internal project structure move to PDCA, while domain terminology remains accurate to the supported standards.

| Area | Rename? | Target |
| --- | --- | --- |
| Solution file | Yes | `AUN-QA.sln` to `PDCA.sln` |
| Top-level project folders | Yes | `AUN-QA.*` to `PDCA.*` |
| .NET project files | Yes | `AUN-QA.*.csproj` / `.esproj` to `PDCA.*` |
| Frontend and Node package names | Yes | `aun-qa-*` to `pdca-*` where present |
| AppHost, launch, deploy, and project references | Yes | Update paths and service/project identity references |
| C# namespaces | No, first phase | Keep `AUN_QA.*` for lower-risk migration |
| Domain standard names | No | Keep `AUN-QA`, `MOET`, and related terms |
| README content | No, this phase | Rewrite after rename verification |
| Local root folder | No, this phase | Keep `D:\Workspace\Personal\AUN-QA` |

## Affected Components

### .NET Solution and Services

The solution and project identities should be renamed to PDCA while preserving the existing architecture:

- `PDCA.ApiGateway`
- `PDCA.AppHost`
- `PDCA.BusinessService`
- `PDCA.BusinessService.Tests`
- `PDCA.CatalogService`
- `PDCA.CatalogService.Tests`
- `PDCA.FileService`
- `PDCA.ServiceDefaults`
- `PDCA.Shared`
- `PDCA.SystemService`
- `PDCA.SystemService.Tests`

The solution file must reference the renamed project paths. Project-to-project references must point to the new `.csproj` and `.esproj` paths. Aspire/AppHost wiring must continue to compose the same services after the folder and project file rename.

### Frontend and Collaboration Services

The React frontend and Node collaboration service should be renamed as project folders and package identities:

- `AUN-QA.Web` to `PDCA.Web`
- `AUN-QA.CollabService` to `PDCA.CollabService`

Package metadata, scripts, Docker/deployment references, Procfile references, and any local path assumptions should be updated where they describe project identity or depend on renamed paths.

### Configuration and Deployment

Configuration files should be updated when they contain solution/project/package identity or filesystem paths that would break after the rename. Examples include:

- `.sln` project entries
- `.csproj` / `.esproj` references
- launch settings
- Docker or deployment configuration
- Aspire generated project reference names and service identifiers
- frontend/collab package metadata

Connection strings, database names, and domain data should only change if they are clearly project-identity labels and not runtime dependencies that would require a migration. If a database name still includes `AUN_QA`, leave it unchanged unless the implementation plan identifies it as a safe configuration-only label.

## Domain Language Rules

Keep `AUN-QA` when it means the actual ASEAN University Network quality assurance standard. Keep `MOET` when it means the Ministry of Education and Training standard. Keep workflow terms such as `SAR`, `Criterion`, `Evidence`, `InternalReview`, `ExternalReview`, `ActionPlan`, and `TaskExecution`.

Use `PDCA` for the product/platform identity, repository project structure, app title where it refers to the product, package names, and deployment/service labels.

## Verification

After implementation, run verification from the repository root:

- `dotnet build PDCA.sln -v minimal`
- `dotnet test PDCA.sln --no-build -v minimal`
- frontend test command in `PDCA.Web`
- collaboration service test command in `PDCA.CollabService`

Known existing test risk: the BusinessService test project has previously failed in `DynamicWatermarkingServiceTests` because PdfSharp could not resolve `Noto Sans` on Windows. The implementation plan should distinguish rename regressions from this pre-existing font resolver issue.

## Completion Criteria

- The repository-internal project identity uses PDCA for solution, project folders, project files, and package/deployment labels covered by the implementation plan.
- The local root folder remains `D:\Workspace\Personal\AUN-QA`.
- AUN-QA and MOET remain available as domain standards.
- Build and relevant test commands have been run, with any pre-existing failures clearly separated from rename-related failures.
- README rewriting has not been performed yet and is explicitly queued as the next phase after the rename is verified.

