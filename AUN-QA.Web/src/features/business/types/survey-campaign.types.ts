import type { BaseRequest } from "@/types/base/base.types";

export interface SurveyCampaign extends BaseRequest {
  Id: string;
  CycleId: string;
  TemplateId: string;
  StakeholderType: number;
  Name: string;
  Status: number;
  ListSession: SurveySession[];
  ListScore: SurveyScore[];
  ListTextAnswer: SurveyTextAnswer[];
}

export interface SurveySession extends BaseRequest {
  Id: string;
  CampaignId: string;
  StakeholderId: number;
  StakeholderName?: string;
  StakeholderEmail?: string;
  Token?: string;
  Status: number;
  SentDate?: string;
  SubmittedDate?: string;
}

export interface SurveyScore extends BaseRequest {
  Id: string;
  CampaignId: string;
  QuestionId: string;
  SessionId: string;
  Score: number;
}

export interface SurveyTextAnswer extends BaseRequest {
  Id: string;
  CampaignId: string;
  QuestionId: string;
  SessionId: string;
  Content: string;
}

export interface SurveyCampaignGetListPaging extends SurveyCampaign {
  CycleName: string;
  TemplateName: string;
  StakeholderTypeName: string;
  StatusName: string;
}

export interface SurveyCampaignGetListPagingRequest {
  PageIndex: number;
  PageSize: number;
  TextSearch?: string;
  StakeholderType?: number;
}
