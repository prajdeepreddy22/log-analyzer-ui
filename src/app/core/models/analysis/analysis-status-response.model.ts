export type AnalysisStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRYING';

export interface AnalysisStatusResponseModel {

  status?: AnalysisStatus;

  analysis_status?: AnalysisStatus;

  message?: string;
}
