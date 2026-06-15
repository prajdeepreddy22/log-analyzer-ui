import { LogLevel } from './log-level.enum';

export interface LogSearchRequestModel {

  keyword: string;

  level?: LogLevel;

  serviceName?: string;

  startDate?: string;

  endDate?: string;

  page: number;

  size: number;

  sortBy: LogSortField;

  direction: 'asc' | 'desc';
}

export type LogSortField =
  | 'logSequence'
  | 'logTimestamp'
  | 'level'
  | 'id';
