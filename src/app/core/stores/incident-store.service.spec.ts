import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { IncidentApiService } from '../api/incident-api.service';
import { IncidentStoreService } from './incident-store.service';
import { IncidentModel } from '../models/incident/incident.model';

const incident: IncidentModel = {
  incidentId: 'incident-1',
  uploadId: 'upload-1',
  logSourceId: null,
  title: 'Null reference failure',
  status: 'OPEN',
  rootCause: 'NULL_REFERENCE_ERROR',
  rootCauseSummary: 'Login failure',
  severityScore: 4,
  confidenceScore: 0.91,
  occurrenceCount: 2,
  firstSeen: '2026-08-17T10:00:00',
  lastSeen: '2026-08-17T10:05:00'
};

describe('IncidentStoreService', () => {
  let store: IncidentStoreService;
  let api: jasmine.SpyObj<IncidentApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<IncidentApiService>(
      'IncidentApiService',
      [
        'getIncidents',
        'getIncident',
        'updateStatus',
        'getHistory'
      ]
    );

    api.getIncidents.and.returnValue(of({
      content: [incident],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1
    }));

    api.getIncident.and.returnValue(of(incident));
    api.getHistory.and.returnValue(of([]));
    api.updateStatus.and.returnValue(of({
      ...incident,
      status: 'INVESTIGATING'
    }));

    TestBed.configureTestingModule({
      providers: [
        IncidentStoreService,
        {
          provide: IncidentApiService,
          useValue: api
        }
      ]
    });

    store = TestBed.inject(IncidentStoreService);
  });

  it('loads incidents with the current filter and pagination', () => {
    store.loadIncidents();

    expect(api.getIncidents).toHaveBeenCalledWith('OPEN', 0, 20);
    expect(store.incidents().length).toBe(1);
    expect(store.totalElements()).toBe(1);
  });

  it('loads selected incident details and history', () => {
    store.selectIncident(incident);

    expect(api.getIncident).toHaveBeenCalledWith('incident-1');
    expect(api.getHistory).toHaveBeenCalledWith('incident-1');
    expect(store.selectedIncident()?.incidentId).toBe('incident-1');
  });

  it('enforces lifecycle transitions before calling the backend', () => {
    store.selectIncident(incident);
    store.updateStatus('FIXED', 'invalid direct jump');

    expect(store.error()).toBe('This status transition is not allowed.');
    expect(api.updateStatus).not.toHaveBeenCalled();

    store.updateStatus('INVESTIGATING', 'checking');

    expect(api.updateStatus).toHaveBeenCalledWith('incident-1', {
      newStatus: 'INVESTIGATING',
      note: 'checking'
    });
    expect(store.selectedIncident()?.status).toBe('INVESTIGATING');
  });

  it('surfaces backend errors safely', () => {
    api.getIncidents.and.returnValue(
      throwError(() => new HttpErrorResponse({
        status: 500,
        error: {
          details: 'Incident service unavailable'
        }
      }))
    );

    store.loadIncidents();

    expect(store.error()).toBe('Incident service unavailable');
  });
});
