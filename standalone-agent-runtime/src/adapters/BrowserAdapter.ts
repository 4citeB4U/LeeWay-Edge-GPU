import { chromium, Browser, Page } from "playwright";

export class BrowserAdapter {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init() {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: false }); // Show the user the agent at work
      this.page = await this.browser.newPage();
    }
  }

  async open({ args }: any) {
    await this.init();
    await this.page!.goto(args.url);
    return { opened: true, url: args.url };
  }

  async click({ args }: any) {
    await this.page!.click(args.selector);
    return { clicked: true, selector: args.selector };
  }

  async fill({ args }: any) {
    await this.page!.fill(args.selector, args.value);
    return { filled: true, selector: args.selector };
  }

  async extractText({ args }: any) {
    const text = await this.page!.textContent(args.selector);
    return { text };
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
