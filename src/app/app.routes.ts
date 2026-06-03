import { Routes } from '@angular/router';

import { AppShellLayoutComponent } from './shared/layouts/app-shell-layout/app-shell-layout.component';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [

  // =========================
  // PUBLIC AUTH ROUTES
  // =========================

  {
    path: 'login',

    loadComponent: () =>
      import(
        './features/auth/pages/login/login.component'
      ).then(
        m => m.LoginComponent
      )
  },

  {
    path: 'register',

    loadComponent: () =>
      import(
        './features/auth/pages/register/register.component'
      ).then(
        m => m.RegisterComponent
      )
  },

  // =========================
  // PROTECTED APP ROUTES
  // =========================

  {
    path: '',

    component: AppShellLayoutComponent,

    canActivate: [authGuard],

    children: [

      // =====================
      // DASHBOARD
      // =====================

      {
        path: 'dashboard',

        loadComponent: () =>
          import(
            './features/dashboard/pages/dashboard-home/dashboard-home.component'
          ).then(
            m => m.DashboardHomeComponent
          )
      },

      // =====================
      // UPLOADS
      // =====================

      {
        path: 'uploads',

        loadComponent: () =>
          import(
            './features/uploads/pages/uploads-page/uploads-page.component'
          ).then(
            m => m.UploadsPageComponent
          )
      },

      // =====================
      // SAFE LOGS REDIRECT
      // =====================

      {
        path: 'logs',
        loadComponent: () =>
          import(
            './features/logs/pages/log-viewer-redirect/log-viewer-redirect.component'
          ).then(
            m => m.LogViewerRedirectComponent
          )
      },

      // =====================
      // LOG VIEWER
      // =====================

      {
        path: 'logs/:uploadId',

        loadComponent: () =>
          import(
            './features/logs/pages/log-viewer-page/log-viewer-page.component'
          ).then(
            m => m.LogViewerPageComponent
          )
      },

      // =====================
      // ANALYSIS
      // =====================

      {
        path: 'analysis',

        loadComponent: () =>
          import(
            './features/analysis/pages/analysis-redirect/analysis-redirect.component'
          ).then(
            m => m.AnalysisRedirectComponent
          )
      },

      {
        path: 'analysis/:uploadId',

        loadComponent: () =>
          import(
            './features/analysis/pages/analysis-page/analysis-page.component'
          ).then(
            m => m.AnalysisPageComponent
          )
      },

      // =====================
      // CHAT
      // =====================

      {
        path: 'chat',

        loadComponent: () =>
          import(
            './features/chat/pages/chat-page/chat-page.component'
          ).then(
            m => m.ChatPageComponent
          )
      },

      // =====================
      // RATE LIMIT
      // =====================

      {
        path: 'rate-limit',

        loadComponent: () =>
          import(
            './features/rate-limit/pages/rate-limit-page/rate-limit-page.component'
          ).then(
            m => m.RateLimitPageComponent
          )
      },

      // =====================
      // DEFAULT APP ROUTE
      // =====================

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // =========================
  // FALLBACK
  // =========================

  {
    path: '**',
    redirectTo: 'login'
  }
];
