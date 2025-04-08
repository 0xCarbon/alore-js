import MailosaurClient from 'mailosaur';
import { v4 as uuidv4 } from 'uuid';

export class EmailHelper {
  private client: MailosaurClient;
  private serverDomain: string;
  public emailAddress: string;

  constructor(apiKey: string, serverDomain: string) {
    if (!apiKey) throw new Error('API key is required');
    if (!serverDomain) throw new Error('Server domain is required');

    this.client = new MailosaurClient(apiKey);
    this.serverDomain = serverDomain;

    this.generateNewEmail(this.serverDomain);
  }

  async generateNewEmail(domain: string): Promise<string> {
    const uuid = uuidv4();

    this.emailAddress = `${uuid}@${domain}`;
  }

  async get2FACode(serverId: string, timeout = 30000): Promise<string> {
    const email = await this.client.messages.get(
      serverId,
      {
        sentTo: this.emailAddress,
      },
      {
        receivedAfter: new Date(),
        timeout,
      },
    );

    const firstCode = email.html?.codes?.[0];

    const codeMatch = firstCode?.value;
    if (!codeMatch) throw new Error('No 2FA code found in email');

    return codeMatch;
  }
}
