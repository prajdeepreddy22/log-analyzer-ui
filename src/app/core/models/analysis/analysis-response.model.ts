import { AnalysisStatus } from './analysis-status-response.model';

export interface AnalysisResponseModel {

  uploadId?: string;

  fileName?: string;

  summary?: string;

  rootCause?: string;

  developerMistake?: string;

  fixSuggestion?: string;

  codeFix?: string;

  severityScore?: number;

  status?: AnalysisStatus;

  analysis_status?: AnalysisStatus;

  analysisStatus?: AnalysisStatus;

  canForce?: boolean;

  message?: string;

  details?: unknown;

  errorMessage?: string;

  error_message?: string;

  createdAt?: string;

  updatedAt?: string;
}
