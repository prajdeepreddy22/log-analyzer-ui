export type IncidentStatus =
  'OPEN' |
  'INVESTIGATING' |
  'FIXED' |
  'VERIFIED' |
  'CLOSED';

export interface IncidentModel {
  incidentId: string;
  uploadId?: string | null;
  logSourceId?: number | null;
  title: string;
  status: IncidentStatus;
  rootCause: string;
  rootCauseSummary?: string | null;
  severityScore: number;
  confidenceScore: number;
  occurrenceCount: number;
  firstSeen: string;
  lastSeen: string;
}

export interface IncidentStatusHistoryModel {
  id: number;
  incidentId: string;
  fromStatus?: IncidentStatus | null;
  toStatus: IncidentStatus;
  changedBy: number;
  changedAt: string;
  note?: string | null;
}

export interface IncidentPageResponseModel {
  content: IncidentModel[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
