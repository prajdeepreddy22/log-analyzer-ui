import {
  ReferencedLogModel
} from './chat-message.model';

export interface ChatResponseModel {

  answer: string;

  source: string;

  confidence: number;

  quality: string;

  insights: string[];

  usedLogs: ReferencedLogModel[];
}