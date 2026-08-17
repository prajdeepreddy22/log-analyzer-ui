import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { IncidentApiService } from './incident-api.service';

const incident = {
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

describe('IncidentApiService', () => {
  let service: IncidentApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(IncidentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads paged incidents with optional status filter', () => {
    service.getIncidents('OPEN', 0, 20)
      .subscribe(response => {
        expect(response.content[0].incidentId).toBe('incident-1');
      });

    const request = httpMock.expectOne(req =>
      req.url === `${environment.apiBaseUrl}/incidents` &&
      req.params.get('status') === 'OPEN' &&
      req.params.get('page') === '0' &&
      req.params.get('size') === '20'
    );

    expect(request.request.method).toBe('GET');

    request.flush({
      content: [incident],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1
    });
  });

  it('loads details, updates status, and loads history', () => {
    service.getIncident('incident-1')
      .subscribe(response => {
        expect(response.title).toBe('Null reference failure');
      });

    const detailRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/incidents/incident-1`
    );

    expect(detailRequest.request.method).toBe('GET');
    detailRequest.flush(incident);

    service.updateStatus('incident-1', {
      newStatus: 'INVESTIGATING',
      note: 'Checking owner service'
    }).subscribe(response => {
      expect(response.status).toBe('INVESTIGATING');
    });

    const patchRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/incidents/incident-1/status`
    );

    expect(patchRequest.request.method).toBe('PATCH');
    expect(patchRequest.request.body).toEqual({
      newStatus: 'INVESTIGATING',
      note: 'Checking owner service'
    });

    patchRequest.flush({
      ...incident,
      status: 'INVESTIGATING'
    });

    service.getHistory('incident-1')
      .subscribe(history => {
        expect(history[0].toStatus).toBe('INVESTIGATING');
      });

    const historyRequest = httpMock.expectOne(
      `${environment.apiBaseUrl}/incidents/incident-1/history`
    );

    expect(historyRequest.request.method).toBe('GET');
    historyRequest.flush([
      {
        id: 1,
        incidentId: 'incident-1',
        fromStatus: 'OPEN',
        toStatus: 'INVESTIGATING',
        changedBy: 1,
        changedAt: '2026-08-17T10:10:00',
        note: 'Checking owner service'
      }
    ]);
  });
});
