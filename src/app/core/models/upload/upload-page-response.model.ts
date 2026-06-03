import { UploadResponseModel } from './upload-response.model';

export interface UploadPageResponseModel {
  content: UploadResponseModel[];

  page: number;
  size: number;

  totalElements: number;
  totalPages: number;

  first: boolean;
  last: boolean;
}