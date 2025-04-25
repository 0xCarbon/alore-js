export interface SocialProvider {
  id: string;
  providerName: string;
  clientId: string;
  enabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
