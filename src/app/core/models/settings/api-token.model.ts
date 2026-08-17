export interface ApiTokenModel {
  id: number;
  token?: string | null;
  scope: string;
  name?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  revoked: boolean;
  message?: string | null;
}
