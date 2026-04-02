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

    public virtual DbSet<Council> Councils { get; set; }

    public virtual DbSet<CriterionEvaluation> CriterionEvaluations { get; set; }

    public virtual DbSet<Cycle> Cycles { get; set; }

    public virtual DbSet<EvaluationSchedule> EvaluationSchedules { get; set; }

    public virtual DbSet<EvaluationSubmission> EvaluationSubmissions { get; set; }

    public virtual DbSet<Evidence> Evidences { get; set; }

    public virtual DbSet<EvidenceAttachment> EvidenceAttachments { get; set; }

    public virtual DbSet<EvidenceCycleMap> EvidenceCycleMaps { get; set; }

    public virtual DbSet<SarReport> SarReports { get; set; }

    public virtual DbSet<SarReviewComment> SarReviewComments { get; set; }

    public virtual DbSet<SurveyCampaign> SurveyCampaigns { get; set; }

    public virtual DbSet<SurveyScore> SurveyScores { get; set; }

    public virtual DbSet<SurveySession> SurveySessions { get; set; }

    public virtual DbSet<SurveyTemplate> SurveyTemplates { get; set; }

    public virtual DbSet<SurveyTextAnswer> SurveyTextAnswers { get; set; }

    public virtual DbSet<TemplateCategory> TemplateCategories { get; set; }

    public virtual DbSet<TemplateQuestion> TemplateQuestions { get; set; }

    public virtual DbSet<TemplateTextQuestion> TemplateTextQuestions { get; set; }

    public virtual DbSet<TemplateTopic> TemplateTopics { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Council>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Council_pk");

            entity.ToTable("Council");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.DelegatedAt).HasColumnType("datetime");
            entity.Property(e => e.DelegatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.DelegatedUntil).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<CriterionEvaluation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("CriterionEvaluation_pk");

            entity.ToTable("CriterionEvaluation");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.ApprovedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Cycle>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Cycle_pk");

            entity.ToTable("Cycle");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.EndDate).HasColumnType("datetime");
            entity.Property(e => e.StartDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EvaluationSchedule>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("EvaluationSchedule_pk");

            entity.ToTable("EvaluationSchedule");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.EndTime).HasColumnType("datetime");
            entity.Property(e => e.StartTime).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EvaluationSubmission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Evaluati__3214EC07AD6C4851");

            entity.ToTable("EvaluationSubmission");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy).HasMaxLength(450);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy).HasMaxLength(450);
        });

        modelBuilder.Entity<Evidence>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Evidence_pk");

            entity.ToTable("Evidence");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.ApprovedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.ExpiryDate).HasColumnType("datetime");
            entity.Property(e => e.IssueDate).HasColumnType("datetime");
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<EvidenceAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("EvidenceAttachment_pk");

            entity.ToTable("EvidenceAttachment");

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

        modelBuilder.Entity<EvidenceCycleMap>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("EvidenceCycleMap_pk");

            entity.ToTable("EvidenceCycleMap");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.FinalDecisionAt).HasColumnType("datetime");
            entity.Property(e => e.FinalDecisionBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
        });

        modelBuilder.Entity<SarReport>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SarRepor__3214EC0728CE31E1");

            entity.ToTable("SarReport");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.ApprovedAt).HasColumnType("datetime");
            entity.Property(e => e.ApprovedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.LastSavedAt).HasColumnType("datetime");
            entity.Property(e => e.RevisionReason).HasMaxLength(1000);
            entity.Property(e => e.RevisionRequestedAt).HasColumnType("datetime");
            entity.Property(e => e.RevisionRequestedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.Status).HasDefaultValue(1);
            entity.Property(e => e.SubmittedAt).HasColumnType("datetime");
            entity.Property(e => e.SubmittedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.YdocSnapshot).HasColumnName("YDocSnapshot");
        });

        modelBuilder.Entity<SarReviewComment>(entity =>
        {
            entity.ToTable("SarReviewComment");

            entity.HasIndex(e => e.CriterionCode, "IX_SarReviewComment_CriterionCode");

            entity.HasIndex(e => e.SarReportId, "IX_SarReviewComment_SarReportId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CommentText).HasMaxLength(2000);
            entity.Property(e => e.CommentType).HasDefaultValue(1);
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getutcdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CriterionCode)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.ResolvedAt).HasColumnType("datetime");
            entity.Property(e => e.ResolvedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.SarReport).WithMany(p => p.SarReviewComments)
                .HasForeignKey(d => d.SarReportId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_SarReviewComment_SarReport");
        });

        modelBuilder.Entity<SurveyCampaign>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SurveyCampaign_pk");

            entity.ToTable("SurveyCampaign");

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

        modelBuilder.Entity<SurveyScore>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SurveyScore_pk");

            entity.ToTable("SurveyScore");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
        });

        modelBuilder.Entity<SurveySession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SurveySession_pk");

            entity.ToTable("SurveySession");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.SentDate).HasColumnType("datetime");
            entity.Property(e => e.SubmittedDate).HasColumnType("datetime");
            entity.Property(e => e.Token).HasMaxLength(256);
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

        modelBuilder.Entity<SurveyTextAnswer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("SurveyTextAnswer_pk");

            entity.ToTable("SurveyTextAnswer");

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
