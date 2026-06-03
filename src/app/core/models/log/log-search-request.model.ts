import { LogLevel } from './log-level.enum';

export interface LogSearchRequestModel {

  keyword: string;

  level?: LogLevel;

  serviceName?: string;

  page: number;

  size: number;

  sortBy: string;

  direction: 'asc' | 'desc';
}