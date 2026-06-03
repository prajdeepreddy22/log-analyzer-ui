export interface ChatMessageModel {

  id: string;

  role:
    | 'user'
    | 'assistant';

  content: string;

  timestamp: string;

  loading?: boolean;

  confidence?: number;

  quality?: string;

  source?: string;

  insights?: string[];

  referencedLogs?: ReferencedLogModel[];
}

export interface ReferencedLogModel {

  id: number;

  timestamp: string;

  level: string;

  message: string;
}
