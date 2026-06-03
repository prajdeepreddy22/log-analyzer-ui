import { LogLevel } from './log-level.enum';

export interface LogResponseModel {

  id: number;

  logSequence: number;

  logTimestamp: string;

  level: LogLevel;

  serviceName: string;

  hostName: string | null;

  environment: string | null;

  source: string | null;

  message: string;
}
