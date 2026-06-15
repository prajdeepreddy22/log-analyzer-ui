import { UploadStatus } from './upload-status.enum';

export interface UploadResponseModel {
  uploadId: string;
  fileName: string;
  fileSize: number;
  fileSizeFormatted?: string;
  status: UploadStatus;
  uploadTime: string;
  message: string;
  totalLogs?: number;
  errorCount?: number;
  warnCount?: number;
  errorMessage?: string;
}
