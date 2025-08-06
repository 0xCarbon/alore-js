import { AuthProviderConfig } from '@alore/auth-react-ui';
import { Page } from '@playwright/test';

export async function navigateTo(page: Page, url: string, params: AuthProviderConfig) {
  await page.goto(`${url}?aloreConfigs=${JSON.stringify(params)}`);
}
