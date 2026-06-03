// log-ai-panel.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { InlineChatPanelComponent }
from '../../../chat/components/inline-chat-panel/inline-chat-panel.component';

import { AnalysisStoreService }
from '../../../../core/stores/analysis-store.service';

import { LogStoreService }
from '../../../../core/stores/log-store.service';

@Component({
  selector: 'app-log-ai-panel',

  standalone: true,

  imports: [
    CommonModule,
    InlineChatPanelComponent
  ],

  templateUrl: './log-ai-panel.component.html',

  styleUrl: './log-ai-panel.component.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush
})
export class LogAiPanelComponent
  implements OnInit {

  readonly analysisStore =
    inject(AnalysisStoreService);

  readonly logStore =
    inject(LogStoreService);

  readonly uploadId =
    input.required<string>();

  // =====================
  // ACTIVE TAB
  // =====================

  readonly activeTab =
    signal<'root-cause' | 'chat'>(
      'root-cause'
    );

  // =====================
  // SELECTED LOG
  // =====================

  readonly selectedLog =
    computed(() =>
      this.logStore.selectedLog()
    );

  readonly hasCompletedAnalysis =
    computed(() =>
      this.analysisStore.isCompleted() &&
      Boolean(
        this.analysisStore.analysis()?.summary ||
        this.analysisStore.analysis()?.rootCause ||
        this.analysisStore.analysis()?.fixSuggestion ||
        this.analysisStore.analysis()?.codeFix
      )
    );

  readonly progressMessage =
    computed(() =>
      this.analysisStore.statusMessage() ||
      'AI analysis is running.'
    );

  ngOnInit(): void {

    this.analysisStore.loadAnalysis(
      this.uploadId()
    );
  }

  retryAnalysis(): void {

    this.analysisStore.triggerAnalysis(
      this.uploadId(),
      true
    );
  }

  runAnalysis(): void {

    this.analysisStore.triggerAnalysis(
      this.uploadId()
    );
  }

  setTab(
    tab: 'root-cause' | 'chat'
  ): void {

    this.activeTab.set(tab);
  }

  getSeverityLabel(
    score?: number
  ): string {

    if (!score) {
      return 'UNKNOWN';
    }

    if (score >= 5) {
      return 'CRITICAL';
    }

    if (score >= 4) {
      return 'HIGH';
    }

    if (score >= 3) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  isSeverityActive(
    block: number,
    score?: number
  ): boolean {

    return (
      score || 0
    ) >= block;
  }
}
