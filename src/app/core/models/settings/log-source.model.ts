export type LogSourceType =
  'WATCHER' |
  'MANUAL' |
  'INTEGRATION';

export type LogSourceStatus =
  'ACTIVE' |
  'INACTIVE';

export interface LogSourceModel {
  id: number;
  sourceName: string;
  sourceType: LogSourceType;
  status: LogSourceStatus;
  internalUploadId?: string | null;
  lastIngestedAt?: string | null;
}
