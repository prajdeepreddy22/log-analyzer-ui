export type AnalysisStatus =
  | 'NOT_STARTED'
  | 'PENDING'
  | 'QUEUED'
  | 'CACHED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRY'
  | 'RETRYING';

export interface AnalysisStatusResponseModel {

  status?: AnalysisStatus;

  analysis_status?: AnalysisStatus;

  analysisStatus?: AnalysisStatus;

  message?: string;

  details?: unknown;

  errorMessage?: string;

  error_message?: string;
}
