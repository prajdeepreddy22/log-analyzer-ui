import { LogResponseModel } from './log-response.model';

export interface LogPageResponseModel {

  content: LogResponseModel[];

  page: number;

  size: number;

  totalElements: number;

  totalPages: number;
}
