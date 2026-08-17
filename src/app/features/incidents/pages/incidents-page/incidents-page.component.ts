import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IncidentStoreService } from '../../../../core/stores/incident-store.service';
import {
  IncidentModel,
  IncidentStatus,
  IncidentStatusHistoryModel
} from '../../../../core/models/incident/incident.model';

@Component({
  selector: 'app-incidents-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './incidents-page.component.html',
  styleUrl: './incidents-page.component.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class IncidentsPageComponent implements OnInit {

  readonly incidentStore =
    inject(IncidentStoreService);

  readonly note =
    signal('');

  readonly selectedNextStatus =
    signal<IncidentStatus | ''>('');

  readonly statuses: (IncidentStatus | '')[] = [
    '',
    'OPEN',
    'INVESTIGATING',
    'FIXED',
    'VERIFIED',
    'CLOSED'
  ];

  ngOnInit(): void {

    this.incidentStore.loadIncidents();
  }

  selectIncident(
    incident: IncidentModel
  ): void {

    this.note.set('');
    this.selectedNextStatus.set('');
    this.incidentStore.selectIncident(incident);
  }

  updateFilter(
    status: string
  ): void {

    this.incidentStore.setStatusFilter(
      status as IncidentStatus | ''
    );
  }

  updateNextStatus(
    status: string
  ): void {

    this.selectedNextStatus.set(
      status as IncidentStatus | ''
    );

    this.incidentStore.clearMessages();
  }

  updateNote(
    value: string
  ): void {

    this.note.set(value);
    this.incidentStore.clearMessages();
  }

  saveStatus(): void {

    const status =
      this.selectedNextStatus();

    if (!status) {
      return;
    }

    this.incidentStore.updateStatus(
      status,
      this.note()
    );

    this.selectedNextStatus.set('');
    this.note.set('');
  }

  nextPage(): void {

    if (
      this.incidentStore.page() <
      this.incidentStore.totalPages() - 1
    ) {
      this.incidentStore.setPage(
        this.incidentStore.page() + 1
      );
    }
  }

  previousPage(): void {

    if (this.incidentStore.page() > 0) {
      this.incidentStore.setPage(
        this.incidentStore.page() - 1
      );
    }
  }

  statusLabel(
    status: IncidentStatus | ''
  ): string {

    return status || 'ALL';
  }

  formatDate(
    value?: string | null
  ): string {

    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat(
      undefined,
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
    ).format(new Date(value));
  }

  confidencePercent(
    value?: number | null
  ): string {

    if (value === undefined || value === null) {
      return '0%';
    }

    return `${Math.round(value * 100)}%`;
  }

  severityClass(
    score?: number | null
  ): string {

    const value = score ?? 0;

    if (value >= 4) {
      return 'high';
    }

    if (value >= 3) {
      return 'medium';
    }

    return 'low';
  }

  trackByIncident(
    _: number,
    incident: IncidentModel
  ): string {

    return incident.incidentId;
  }

  trackByHistory(
    _: number,
    history: IncidentStatusHistoryModel
  ): number {

    return history.id;
  }
}
