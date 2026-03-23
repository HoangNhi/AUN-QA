using System;
using System.Collections.Generic;
using AUN_QA.CatalogService.Entities;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.CatalogService.Infrastructure.Data;

public partial class CatalogContext : DbContext
{
    public CatalogContext(DbContextOptions<CatalogContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Criterion> Criteria { get; set; }

    public virtual DbSet<CriterionRequirement> CriterionRequirements { get; set; }

    public virtual DbSet<Faculty> Faculties { get; set; }

    public virtual DbSet<FileType> FileTypes { get; set; }

    public virtual DbSet<Stakeholder> Stakeholders { get; set; }

    public virtual DbSet<Standard> Standards { get; set; }

    public virtual DbSet<StandardSet> StandardSets { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_0900_ai_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<Criterion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("Criterion");

            entity.Property(e => e.Id)
                .UseCollation("ascii_general_ci")
                .HasCharSet("ascii");
            entity.Property(e => e.Code).HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.DiagnosticQuestions).HasColumnType("text");
            entity.Property(e => e.Name).HasColumnType("text");
            entity.Property(e => e.StandardId)
                .UseCollation("ascii_general_ci")
                .HasCharSet("ascii");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<CriterionRequirement>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("CriterionRequirement");

            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Suggestion).HasColumnType("text");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<Faculty>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("Faculty");

            entity.Property(e => e.Id)
                .UseCollation("ascii_general_ci")
                .HasCharSet("ascii");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("utc_timestamp()")
                .HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.IsActived)
                .IsRequired()
                .HasDefaultValueSql("'1'");
            entity.Property(e => e.Name).HasColumnType("text");
            entity.Property(e => e.UpdatedAt)
                .HasDefaultValueSql("utc_timestamp()")
                .HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<FileType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("FileType");

            entity.Property(e => e.Code).HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Name).HasColumnType("text");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<Stakeholder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("Stakeholder");

            entity.Property(e => e.Id)
                .UseCollation("ascii_general_ci")
                .HasCharSet("ascii");
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Email).HasColumnType("text");
            entity.Property(e => e.FullName).HasColumnType("text");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<Standard>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("Standard");

            entity.Property(e => e.Code).HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Name).HasColumnType("text");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        modelBuilder.Entity<StandardSet>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("StandardSet");

            entity.Property(e => e.Code).HasColumnType("text");
            entity.Property(e => e.CreatedAt).HasColumnType("timestamp");
            entity.Property(e => e.CreatedBy).HasMaxLength(255);
            entity.Property(e => e.Description).HasColumnType("text");
            entity.Property(e => e.Name).HasColumnType("text");
            entity.Property(e => e.UpdatedAt).HasColumnType("timestamp");
            entity.Property(e => e.UpdatedBy).HasMaxLength(255);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
