export class GeminiRequest {
  uri:URL;

  constructor(uri:URL) {
    this.uri = uri;
  }

  /** Gets the request as a Uint8Array. */
  get requestBytes(): Uint8Array {
    return new TextEncoder().encode(`${this.uri.toString()}\r\n`);
  }
}
