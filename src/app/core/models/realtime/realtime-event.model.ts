export type RealtimeEventType =
  'CONNECTED' |
  'LOG_INGESTED' |
  'ANALYSIS_STARTED' |
  'ANALYSIS_COMPLETED' |
  'INCIDENT_STATUS_CHANGED';

export interface RealtimeEventModel<TData = unknown> {
  type: RealtimeEventType;
  data: TData;
  timestamp: string;
}

export interface RealtimeConnectedData {
  message: string;
}

export interface LogIngestedEventData {
  sourceId: number;
  count: number;
}

export interface AnalysisStartedEventData {
  analysisId: number;
  uploadId: string;
}

export interface AnalysisCompletedEventData {
  analysisId: number;
  uploadId: string;
  status: string;
  confidence: string;
}

export interface IncidentStatusChangedEventData {
  incidentId: string;
  fromStatus: string;
  toStatus: string;
}
