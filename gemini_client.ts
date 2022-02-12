import { GeminiRequest } from "./gemini_request.ts";
import { GeminiResponse } from "./gemini_response.ts";
import { GeminiResponseTiming } from './gemini_response_timing.ts';

/** A client for interacting with Gemini servers. */
export class GeminiClient {
  /** 
   * The amount of data we read at once. 2048 is picked out of the air, but seems
   * to work well enough.
   */
  private readonly BUFFER_SIZE = 2048;

  /** Perform a Gemini transaction. */
  async transaction(request:GeminiRequest): Promise<GeminiResponse> {
    let buffer = new Uint8Array(this.BUFFER_SIZE);
    let bytesRead: number | null = 0;
    let response:Uint8Array = new Uint8Array(0);
    let writeStartMillis:number;
    let readStartMillis!:number;

    const startMillis = Date.now();
    const connection = await Deno.connectTls({
      hostname: request.uri.hostname,
      port: Number(request.uri.port) || 1965,
    });
    
    writeStartMillis = Date.now();
    await connection.write(request.requestBytes);

    do {      
      bytesRead = await connection.read(buffer);
      if (!readStartMillis) readStartMillis = Date.now();
      response = this.concatenateUint8Arrays(response, buffer.slice(0, bytesRead!));
      buffer = new Uint8Array(this.BUFFER_SIZE);
    } while (bytesRead && bytesRead > 0);
    const readCompleteMillis = Date.now();
    const timingInfo = new GeminiResponseTiming(startMillis, writeStartMillis,
      readStartMillis, readCompleteMillis);
    return new GeminiResponse(response, timingInfo);
  }

  /** Concatenate two UInt8Arrays. */
  private concatenateUint8Arrays(a:Uint8Array, b:Uint8Array):Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a, 0);
    result.set(b, a.length);
    return result;
  }
}
