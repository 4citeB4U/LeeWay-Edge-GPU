import { BrowserAdapter } from "./BrowserAdapter";

export class GoogleVoiceAdapter {
  constructor(private browser: BrowserAdapter) {}

  async detectIncoming() {
    // Check for the 'Answer call' button in the Google Voice UI
    const result = await this.browser.extractText({ 
      args: { selector: '[aria-label="Answer call"]' } 
    });
    return { incoming: !!result.text };
  }

  async answerCall() {
    await this.browser.click({ 
      args: { selector: '[aria-label="Answer call"]' } 
    });
    return { callState: "connected" };
  }

  async captureNotes({ args }: any) {
    // This could involve typing into a local field or a doc
    return { notesCaptured: true, summary: args.template };
  }
}

export class GmailAdapter {
  constructor(private browser: BrowserAdapter) {}

  async detectUnread() {
    // Simple check for unread row count in Gmail
    const result = await this.browser.extractText({
      args: { selector: 'tr.zE' }
    });
    return { unreadFound: !!result.text, count: 1 };
  }

  async draftReply({ args }: any) {
    await this.browser.click({ args: { selector: 'div[aria-label="Reply"]' } });
    await this.browser.fill({ 
      args: { selector: 'div[aria-label="Message Body"]', value: args.body } 
    });
    return { drafted: true };
  }

  async sendReply() {
    await this.browser.click({ args: { selector: 'div[aria-label="Send"]' } });
    return { sent: true };
  }
}
