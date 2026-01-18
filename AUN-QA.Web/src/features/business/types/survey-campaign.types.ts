import type {
  BaseRequest,
  GetListPagingRequest,
} from "@/types/base/base.types";
import type { TemplateTopic } from "./survey-template.types";

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
  ListTopic?: TemplateTopic[];
}

export interface SurveySession extends BaseRequest {
  Id: string;
  CampaignId: string;
  StakeholderId: string;
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
  Cycle: string;
  Stakeholder: string;
}

export interface SurveyCampaignGetListPagingRequest extends GetListPagingRequest {
  StakeholderType?: number;
  CycleId?: string;
}
