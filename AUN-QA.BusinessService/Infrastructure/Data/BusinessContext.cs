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

    public virtual DbSet<ActionPlan> ActionPlans { get; set; }

    public virtual DbSet<ActionPlanAssignee> ActionPlanAssignees { get; set; }

    public virtual DbSet<ActionPlanAttachment> ActionPlanAttachments { get; set; }

    public virtual DbSet<ActionTask> ActionTasks { get; set; }

    public virtual DbSet<ActionTaskAttachment> ActionTaskAttachments { get; set; }

    public virtual DbSet<Council> Councils { get; set; }

    public virtual DbSet<CriterionEvaluation> CriterionEvaluations { get; set; }

    public virtual DbSet<Cycle> Cycles { get; set; }

    public virtual DbSet<EvaluationSchedule> EvaluationSchedules { get; set; }

    public virtual DbSet<EvaluationSubmission> EvaluationSubmissions { get; set; }

    public virtual DbSet<Evidence> Evidences { get; set; }

    public virtual DbSet<EvidenceAttachment> EvidenceAttachments { get; set; }

    public virtual DbSet<EvidenceCycleMap> EvidenceCycleMaps { get; set; }

    public virtual DbSet<ExternalReview> ExternalReviews { get; set; }

    public virtual DbSet<ExternalReviewAccount> ExternalReviewAccounts { get; set; }

    public virtual DbSet<ExternalReviewFinding> ExternalReviewFindings { get; set; }

    public virtual DbSet<ExternalReviewResult> ExternalReviewResults { get; set; }

    public virtual DbSet<InternalComment> InternalComments { get; set; }

    public virtual DbSet<SarReport> SarReports { get; set; }

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
        modelBuilder.Entity<ActionPlan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ActionPlan_pk");

            entity.ToTable("ActionPlan");

            entity.HasIndex(e => new { e.CycleId, e.Deadline }, "IX_ActionPlan_CycleId_Deadline");

            entity.HasIndex(e => new { e.CycleId, e.Status }, "IX_ActionPlan_CycleId_Status");

            entity.HasIndex(e => e.SourceFindingId, "IX_ActionPlan_SourceFindingId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AssignedAt).HasColumnType("datetime");
            entity.Property(e => e.AssignedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CompletedBy).HasMaxLength(36);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.Deadline).HasColumnType("datetime");
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.Priority).HasDefaultValue(2);
            entity.Property(e => e.Status).HasDefaultValue(1);
            entity.Property(e => e.Title).HasMaxLength(500);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.Cycle).WithMany(p => p.ActionPlans)
                .HasForeignKey(d => d.CycleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ActionPlan_Cycle_fk");

            entity.HasOne(d => d.SourceFinding).WithMany(p => p.ActionPlans)
                .HasForeignKey(d => d.SourceFindingId)
                .HasConstraintName("ActionPlan_SourceFinding_fk");
        });

        modelBuilder.Entity<ActionPlanAssignee>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ActionPlanAssignee_pk");

            entity.ToTable("ActionPlanAssignee");

            entity.HasIndex(e => new { e.ActionPlanId, e.UserId }, "IX_ActionPlanAssignee_ActionPlanId_UserId_Active")
                .IsUnique()
                .HasFilter("([IsDeleted]=(0))");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.AssignedAt).HasColumnType("datetime");
            entity.Property(e => e.AssignedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.ActionPlan).WithMany(p => p.ActionPlanAssignees)
                .HasForeignKey(d => d.ActionPlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ActionPlanAssignee_ActionPlan_fk");
        });

        modelBuilder.Entity<ActionPlanAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ActionPl__3214EC07C13DDAF8");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CreatedBy).HasMaxLength(200);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedBy).HasMaxLength(200);
        });

        modelBuilder.Entity<ActionTask>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ActionTask_pk");

            entity.ToTable("ActionTask");

            entity.HasIndex(e => new { e.ActionPlanId, e.TaskStatus }, "IX_ActionTask_ActionPlanId_TaskStatus");

            entity.HasIndex(e => e.DueDate, "IX_ActionTask_DueDate");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CompletedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.DueDate).HasColumnType("datetime");
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.TaskStatus).HasDefaultValue(1);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.ActionPlan).WithMany(p => p.ActionTasks)
                .HasForeignKey(d => d.ActionPlanId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ActionTask_ActionPlan_fk");
        });

        modelBuilder.Entity<ActionTaskAttachment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ActionTaskAttachment_pk");

            entity.ToTable("ActionTaskAttachment");

            entity.HasIndex(e => e.ActionTaskId, "IX_ActionTaskAttachment_ActionTaskId");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.FileName).HasMaxLength(500);
            entity.Property(e => e.FileUrl).HasMaxLength(2000);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.UploadedAt).HasColumnType("datetime");
            entity.Property(e => e.UploadedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.ActionTask).WithMany(p => p.ActionTaskAttachments)
                .HasForeignKey(d => d.ActionTaskId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ActionTaskAttachment_ActionTask_fk");
        });

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

        modelBuilder.Entity<ExternalReview>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ExternalReview_pk");

            entity.ToTable("ExternalReview");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CompletedAt).HasColumnType("datetime");
            entity.Property(e => e.CompletedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.UpdatedAt).HasColumnType("datetime");
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);
            entity.Property(e => e.WatermarkOpacity).HasDefaultValue(25);
            entity.Property(e => e.WatermarkText).HasMaxLength(500);

            entity.HasOne(d => d.Cycle).WithMany(p => p.ExternalReviews)
                .HasForeignKey(d => d.CycleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExternalReview_Cycle_fk");
        });

        modelBuilder.Entity<ExternalReviewAccount>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ExternalReviewAccount_pk");

            entity.ToTable("ExternalReviewAccount");

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.CreatedAt).HasColumnType("datetime");
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(256)
                .IsUnicode(false);

            entity.HasOne(d => d.ExternalReview).WithMany(p => p.ExternalReviewAccounts)
                .HasForeignKey(d => d.ExternalReviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExternalReviewAccount_ExternalReview_fk");
        });

        modelBuilder.Entity<ExternalReviewFinding>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ExternalReviewFinding_pk");

            entity.ToTable("ExternalReviewFinding");

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

            entity.HasOne(d => d.ExternalReviewResult).WithMany(p => p.ExternalReviewFindings)
                .HasForeignKey(d => d.ExternalReviewResultId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExternalReviewFinding_Result_fk");
        });

        modelBuilder.Entity<ExternalReviewResult>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("ExternalReviewResult_pk");

            entity.ToTable("ExternalReviewResult");

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

            entity.HasOne(d => d.ExternalReview).WithMany(p => p.ExternalReviewResults)
                .HasForeignKey(d => d.ExternalReviewId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("ExternalReviewResult_ExternalReview_fk");
        });

        modelBuilder.Entity<InternalComment>(entity =>
        {
            entity.ToTable("InternalComment");

            entity.HasIndex(e => e.ReviewRound, "IX_InternalComment_ReviewRound");

            entity.HasIndex(e => e.SarReportId, "IX_InternalComment_SarReportId");

            entity.Property(e => e.Id).HasDefaultValueSql("(newid())");
            entity.Property(e => e.CommentMarkId).HasMaxLength(100);
            entity.Property(e => e.CommentText).HasMaxLength(2000);
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getutcdate())");
            entity.Property(e => e.CreatedBy).HasMaxLength(256);
            entity.Property(e => e.HighlightedText).HasMaxLength(500);
            entity.Property(e => e.IsActived).HasDefaultValue(true);
            entity.Property(e => e.ReviewRound).HasDefaultValue(1);
            entity.Property(e => e.UpdatedBy).HasMaxLength(256);

            entity.HasOne(d => d.SarReport).WithMany(p => p.InternalComments)
                .HasForeignKey(d => d.SarReportId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_InternalComment_SarReport");
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
