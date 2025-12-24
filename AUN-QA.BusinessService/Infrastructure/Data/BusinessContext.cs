using System;
using System.Collections.Generic;
using AUN_QA.BusinessService.Entities;
using Microsoft.EntityFrameworkCore;

namespace AUN_QA.BusinessService.Infrastructure.Data;

public partial class BusinessContext : DbContext
{
    public BusinessContext(DbContextOptions<BusinessContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Evidence> Evidences { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Evidence>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Evidence_pk");

            entity.ToTable("Evidence");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
