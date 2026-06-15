import { UploadStatus } from './upload-status.enum';

export interface UploadStatusResponseModel {
  uploadId: string;
  status: UploadStatus;
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  errorMessage?: string;
}
