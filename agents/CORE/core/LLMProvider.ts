/*
LEEWAY HEADER — DO NOT REMOVE
REGION: CORE.INFERENCE
TAG: CORE.LLM_PROVIDER
5WH:
  WHAT = Local-first LLM inference provider client
  WHY = Connects agents to the sovereign Llama server without cloud dependencies
  WHO = LeeWay Innovations
*/

import { eventBus } from './EventBus';

export class LLMProvider {
  private static readonly ENDPOINT = "http://localhost:8080/v1/chat/completions";

  /**
   * Generates a response from the local Llama server.
   * Optimized for 4096 context window and hardware acceleration where available.
   */
  static async generate(prompt: string, options: any = {}): Promise<string> {
    console.log(`🧠 LLM_PROVIDER: Requesting inference for prompt length: ${prompt.length}`);
    
    try {
      const response = await fetch(this.ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1024,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Inference engine reported error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      
      return text;
    } catch (err) {
      console.error(`❌ LLM_PROVIDER_FAILURE: ${err.message}`);
      // Fallback for demo settings if server is not running
      return "The Sovereign Engine is offline. Please initialize llama-server with -c 4096 and -ngl <layers>.";
    }
  }
}
