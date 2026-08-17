import { LogSourceType } from './log-source.model';

export interface CreateLogSourceRequestModel {
  sourceName: string;
  sourceType: LogSourceType;
}
