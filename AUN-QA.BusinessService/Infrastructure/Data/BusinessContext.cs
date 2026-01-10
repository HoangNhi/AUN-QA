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

    public virtual DbSet<EvidenceAttachment> EvidenceAttachments { get; set; }

    public virtual DbSet<SurveyTemplate> SurveyTemplates { get; set; }

    public virtual DbSet<TemplateCategory> TemplateCategories { get; set; }

    public virtual DbSet<TemplateQuestion> TemplateQuestions { get; set; }

    public virtual DbSet<TemplateTextQuestion> TemplateTextQuestions { get; set; }

    public virtual DbSet<TemplateTopic> TemplateTopics { get; set; }

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

        modelBuilder.Entity<EvidenceAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Evidence_Attachment_pk");

            entity.ToTable("Evidence_Attachment");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<SurveyTemplate>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SurveyTemplate_pk");

            entity.ToTable("SurveyTemplate");

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

        modelBuilder.Entity<TemplateCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TemplateCategory_pk");

            entity.ToTable("TemplateCategory");

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

        modelBuilder.Entity<TemplateQuestion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TemplateQuestion_pk");

            entity.ToTable("TemplateQuestion");

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

        modelBuilder.Entity<TemplateTextQuestion>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TemplateTextQuestion_pk");

            entity.ToTable("TemplateTextQuestion");

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

        modelBuilder.Entity<TemplateTopic>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("TemplateTopic_pk");

            entity.ToTable("TemplateTopic");

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
