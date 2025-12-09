export interface Menu {
  Id: string;
  Controller: string;
  Name: string;
  SystemGroupId: string;
  Sort: number;
  CanView: boolean;
  CanAdd: boolean;
  CanUpdate: boolean;
  CanDelete: boolean;
  CanApprove: boolean;
  CanAnalyze: boolean;
  IsEdit: boolean;
}
