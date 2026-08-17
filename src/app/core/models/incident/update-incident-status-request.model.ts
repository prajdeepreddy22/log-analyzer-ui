import { IncidentStatus } from './incident.model';

export interface UpdateIncidentStatusRequestModel {
  newStatus: IncidentStatus;
  note?: string;
}
