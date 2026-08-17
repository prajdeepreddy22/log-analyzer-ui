import {
  Injectable,
  computed,
  inject,
  signal
} from '@angular/core';

import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { IncidentApiService } from '../api/incident-api.service';
import {
  IncidentModel,
  IncidentStatus,
  IncidentStatusHistoryModel
} from '../models/incident/incident.model';
import { getApiErrorMessage } from '../utils/api-error-message.util';

@Injectable({
  providedIn: 'root'
})
export class IncidentStoreService {

  private readonly incidentApi =
    inject(IncidentApiService);

  readonly incidents =
    signal<IncidentModel[]>([]);

  readonly selectedIncident =
    signal<IncidentModel | null>(null);

  readonly history =
    signal<IncidentStatusHistoryModel[]>([]);

  readonly loading =
    signal(false);

  readonly detailLoading =
    signal(false);

  readonly historyLoading =
    signal(false);

  readonly updating =
    signal(false);

  readonly error =
    signal<string | null>(null);

  readonly success =
    signal<string | null>(null);

  readonly statusFilter =
    signal<IncidentStatus | ''>('OPEN');

  readonly page =
    signal(0);

  readonly size =
    signal(20);

  readonly totalPages =
    signal(0);

  readonly totalElements =
    signal(0);

  readonly hasIncidents = computed(() =>
    this.incidents().length > 0
  );

  readonly openCount = computed(() =>
    this.incidents().filter(incident =>
      incident.status !== 'CLOSED'
    ).length
  );

  readonly allowedStatuses = computed(() => {

    const incident =
      this.selectedIncident();

    return incident
      ? this.nextStatuses(incident.status)
      : [];
  });

  loadIncidents(): void {

    this.loading.set(true);
    this.error.set(null);

    this.incidentApi
      .getIncidents(
        this.statusFilter(),
        this.page(),
        this.size()
      )
      .pipe(
        finalize(() =>
          this.loading.set(false)
        )
      )
      .subscribe({
        next: response => {
          this.incidents.set(response.content);
          this.page.set(response.page);
          this.size.set(response.size);
          this.totalElements.set(response.totalElements);
          this.totalPages.set(response.totalPages);

          const selectedId =
            this.selectedIncident()?.incidentId;

          if (selectedId) {
            const updatedSelection =
              response.content.find(incident =>
                incident.incidentId === selectedId
              );

            if (updatedSelection) {
              this.selectedIncident.set(updatedSelection);
            }
          }
        },
        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to load incidents.'
            )
          );
        }
      });
  }

  selectIncident(
    incident: IncidentModel
  ): void {

    this.selectedIncident.set(incident);
    this.success.set(null);
    this.error.set(null);
    this.loadIncident(incident.incidentId);
    this.loadHistory(incident.incidentId);
  }

  loadIncident(
    incidentId: string
  ): void {

    this.detailLoading.set(true);
    this.error.set(null);

    this.incidentApi
      .getIncident(incidentId)
      .pipe(
        finalize(() =>
          this.detailLoading.set(false)
        )
      )
      .subscribe({
        next: incident => {
          this.selectedIncident.set(incident);
          this.replaceIncident(incident);
        },
        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to load incident details.'
            )
          );
        }
      });
  }

  loadHistory(
    incidentId: string
  ): void {

    this.historyLoading.set(true);

    this.incidentApi
      .getHistory(incidentId)
      .pipe(
        finalize(() =>
          this.historyLoading.set(false)
        )
      )
      .subscribe({
        next: history => {
          this.history.set(history);
        },
        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to load incident history.'
            )
          );
        }
      });
  }

  updateStatus(
    status: IncidentStatus,
    note: string
  ): void {

    const incident =
      this.selectedIncident();

    if (!incident) {
      return;
    }

    if (!this.canTransition(incident.status, status)) {
      this.error.set('This status transition is not allowed.');
      return;
    }

    this.updating.set(true);
    this.error.set(null);
    this.success.set(null);

    this.incidentApi
      .updateStatus(
        incident.incidentId,
        {
          newStatus: status,
          note: note.trim() || undefined
        }
      )
      .pipe(
        finalize(() =>
          this.updating.set(false)
        )
      )
      .subscribe({
        next: updatedIncident => {
          this.selectedIncident.set(updatedIncident);
          this.replaceIncident(updatedIncident);
          this.loadHistory(updatedIncident.incidentId);
          this.success.set('Incident status updated.');
        },
        error: error => {
          this.error.set(
            this.errorMessage(
              error,
              'Failed to update incident status.'
            )
          );
        }
      });
  }

  setStatusFilter(
    status: IncidentStatus | ''
  ): void {

    this.statusFilter.set(status);
    this.page.set(0);
    this.loadIncidents();
  }

  setPage(
    page: number
  ): void {

    this.page.set(
      Math.max(page, 0)
    );

    this.loadIncidents();
  }

  setSize(
    size: number
  ): void {

    this.size.set(
      Math.min(
        Math.max(size, 1),
        100
      )
    );

    this.page.set(0);
    this.loadIncidents();
  }

  refreshCurrentView(): void {

    this.loadIncidents();

    const selected =
      this.selectedIncident();

    if (selected) {
      this.loadIncident(selected.incidentId);
      this.loadHistory(selected.incidentId);
    }
  }

  clearMessages(): void {

    this.error.set(null);
    this.success.set(null);
  }

  reset(): void {

    this.incidents.set([]);
    this.selectedIncident.set(null);
    this.history.set([]);
    this.loading.set(false);
    this.detailLoading.set(false);
    this.historyLoading.set(false);
    this.updating.set(false);
    this.error.set(null);
    this.success.set(null);
    this.statusFilter.set('OPEN');
    this.page.set(0);
    this.size.set(20);
    this.totalPages.set(0);
    this.totalElements.set(0);
  }

  canTransition(
    from: IncidentStatus,
    to: IncidentStatus
  ): boolean {

    return this.nextStatuses(from).includes(to);
  }

  nextStatuses(
    status: IncidentStatus
  ): IncidentStatus[] {

    switch (status) {
      case 'OPEN':
        return ['INVESTIGATING', 'CLOSED'];
      case 'INVESTIGATING':
        return ['FIXED', 'CLOSED'];
      case 'FIXED':
        return ['VERIFIED', 'INVESTIGATING'];
      case 'VERIFIED':
        return ['CLOSED'];
      case 'CLOSED':
        return [];
    }
  }

  private replaceIncident(
    incident: IncidentModel
  ): void {

    this.incidents.update(incidents =>
      incidents.map(item =>
        item.incidentId === incident.incidentId
          ? incident
          : item
      )
    );
  }

  private errorMessage(
    error: unknown,
    fallback: string
  ): string {

    return error instanceof HttpErrorResponse
      ? getApiErrorMessage(error)
      : fallback;
  }
}
