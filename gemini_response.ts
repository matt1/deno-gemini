import {GeminiResponseTiming} from './gemini_response_timing.ts';
import {GeminiStatuses} from './gemini_status.ts';

export class GeminiResponse {
  private _bytes:Uint8Array = new Uint8Array(0);
  private _status:Number = -1;
  private _meta:String = "";
  private _responseTiming!: GeminiResponseTiming;
  private decoder = new TextDecoder();
  private metaEnd = -1;

  get timing(): GeminiResponseTiming {
    return this._responseTiming;
  }
  /** Raw bytes for the entire response - includes header. */
  get bytes(): Uint8Array {
    return this._bytes;
  }
  get status(): Number {
    return this._status;
  }
  get meta():String {
    return this._meta;
  }
  /** Actual payload of the response (not including header). */
  get payload():Uint8Array {
    this.findMetaEnd();
    // Add 2 for CR+LF    
    return this._bytes.slice(this.metaEnd + 2);
  }

  constructor(bytes:Uint8Array, responseTiming: GeminiResponseTiming) {
    this._bytes = bytes;
    this._responseTiming = responseTiming;
    this.parseStatus();
    this.parseMeta();
    // Don't bother slicing bytes for the payload until we're asked for it via
    // getter.
  }

  private parseStatus() {
    this._status = Number(this.decoder.decode(this._bytes.slice(0, 2)));
    
    // If 3rd character was not a space, or the status was not recognised then throw
    if (this._bytes.indexOf(32) !== 2) {
      throw new Error(`Space character was not found at position 2 (3rd character) of header.`);
    }
    if (!GeminiStatuses.has(this._status)) {
      throw new Error(`Unrecognised status '${this._status}'.`);
    }
  }

  private parseMeta() {
    this.findMetaEnd();
    this._meta = this.decoder.decode(this._bytes.slice(3, this.metaEnd));
  }

  private findMetaEnd() {
    // Return if already found.
    if (this.metaEnd > 0) return;

    // Start at position 3, since first two bytes are the status, then a space.
    for (let i = 3; i<this._bytes.length;i++) {
      if (this._bytes[i] === 0x0d) {  // CR = 13 aka 0x0d
        this.metaEnd = i;
        break;
      }
    }
    if (this.metaEnd < 0) {
      throw new Error('Could not find meta end!');
    }
  }
}
