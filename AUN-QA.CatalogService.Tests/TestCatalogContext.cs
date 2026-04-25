using AUN_QA.CatalogService.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace AUN_QA.CatalogService.Tests;

internal sealed class TestCatalogContext : CatalogContext, IDbContextFactory<CatalogContext>
{
    private readonly string _databaseName;
    private readonly InMemoryDatabaseRoot _databaseRoot;

    public string DatabaseName => _databaseName;

    public InMemoryDatabaseRoot DatabaseRoot => _databaseRoot;

    public TestCatalogContext()
        : this(Guid.NewGuid().ToString("N"), new InMemoryDatabaseRoot())
    {
    }

    private TestCatalogContext(string databaseName, InMemoryDatabaseRoot databaseRoot)
        : base(new DbContextOptionsBuilder<CatalogContext>()
            .UseInMemoryDatabase(databaseName, databaseRoot)
            .Options)
    {
        _databaseName = databaseName;
        _databaseRoot = databaseRoot;
    }

    public CatalogContext CreateDbContext()
        => new(new DbContextOptionsBuilder<CatalogContext>()
            .UseInMemoryDatabase(_databaseName, _databaseRoot)
            .Options);
}
