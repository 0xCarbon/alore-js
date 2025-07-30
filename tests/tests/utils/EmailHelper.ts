/* eslint-disable no-await-in-loop,no-promise-executor-return */
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

export class TestMailHelper {
  private apiKey: string;

  private namespace: string;

  private tag: string = '';

  public emailAddress: string = '';

  constructor(apiKey: string, namespace: string) {
    if (!apiKey) throw new Error('API key is required');
    if (!namespace) throw new Error('Namespace is required');

    this.apiKey = apiKey;
    this.namespace = namespace;
    this.generateNewEmail();
  }

  async generateNewEmail(): Promise<void> {
    this.tag = uuidv4().replace(/-/g, '').substring(0, 10);
    this.emailAddress = `${this.namespace}.${this.tag}@inbox.testmail.app`;
  }

  async get2FACode(type: 'register' | 'login' = 'register', timeout = 30000): Promise<string> {
    const startTime = Date.now();
    const pollInterval = 2000; // Check every 2 seconds

    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(
          `https://api.testmail.app/api/json?apikey=${this.apiKey}&namespace=${this.namespace}&tag=${this.tag}`,
        );

        const { emails } = response.data;
        if (emails.length > 0) {
          console.log('emails', emails);
          const latestEmail = emails[emails.length - 1];
          console.log('latestEmail', latestEmail);
          const textString = type === 'register' ? 'código de registro' : 'código de acesso';
          const textMatch = latestEmail.text.match(`${textString}[:\\s]`);
          console.log('textMatch', textMatch);
          const codeMatch = latestEmail.text.match(/\b\d{6}\b/);
          console.log('codeMatch', codeMatch);
          if (textMatch && codeMatch && codeMatch[0]) {
            return codeMatch[0];
          }
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }

      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(
      `No 2FA code found for type "${type}" within the ${timeout / 1000}s timeout period.`,
    );
  }
}
