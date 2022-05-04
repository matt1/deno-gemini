import {serve, Server, ServerRequest} from "https://deno.land/std/http/server.ts";
import {GeminiClient} from "./gemini_client.ts";
import { GeminiRequest } from "./gemini_request.ts";
import { GeminiResponse } from "./gemini_response.ts";

const PORT = 1965;
const URL_PARAM_REGEX = /^\/gemini:\/\/(.*)$/;

/** A simple Gemini-over-HTTPS proxy. */
export class GeminiProxy {
  readonly server: Server;
  readonly geminiClient: GeminiClient;

  constructor() {
    this.server = serve({
      port: PORT,
    });

    this.geminiClient = new GeminiClient();
  }

  /** Server Gemini-over-HTTPS requests. */
  async serve() {
    console.log(`Starting server on ${PORT}`);

    while (true) {
      try {
        for await (const request of this.server) {
          if (!request.url.startsWith('/gemini://')) {
            console.warn(`Bad URL - expected to start with 'gemini://': ${request.url}`);
            request.respond({
              status: 400,
              body: `400 Bad Request: proxy requests only served by '/gemini://' URL.`
            });
          } else if (request.method !== 'GET') {
            console.warn(`Bad HTTP method - expected GET but got ${request.method}`);
            request.respond({
              status: 400,
              body: `400 Bad Request: ${request.method} not supported - only GET.`
            });
          } else {
            // Everything else is fine - handle this request
            this.handleRequest(request);
          }
        }

          
      } catch (error) {
        console.warn(error);
      }
    }
  }

  private async handleRequest(request:ServerRequest) {
    const headers = new Headers();
    let uri = '';

    const matches = request.url.match(URL_PARAM_REGEX);
    try {
      if(matches && matches[1]) {
        uri = decodeURIComponent(matches[1]);
      } else {
        console.warn('Unable to parse proxy URI');
        request.respond({
          status: 400,
          body: `400 Bad Request: unable to parse request '${request.url}'.`
        });
        return;
      }
    } catch (error) {
      console.warn('Unable to decode URI');
      console.warn(error);
      request.respond({
        status: 400,
        body: `400 Bad Request: malformed URL encoding.`
      });
      return;
    }


    let response: GeminiResponse;

    try {
      const url = new URL(`gemini://${uri}`);
      const request = new GeminiRequest(url);

      headers.set('Content-Type', 'text/plain; charset=utf-8');
      headers.set('Via', `Gemini 0.16.1 ${url.hostname}`)
      headers.append("access-control-allow-origin", "*");
      headers.append(
        "access-control-allow-headers",
        "Origin, X-Requested-With, Content-Type, Accept, Range",
      );

      response = await this.geminiClient.transaction(request);

    } catch (error) {
      console.log(`Error from client: ${error}`);
      console.warn(`Error making gemini request ${error}`);
      request.respond({
        status: 500,
        headers,
        body: `500 Error: unable to complete gemini request '${error}'.`
      });
      return;
    }

    headers.set('X-Gemini-Status', String(response.status));
    headers.set('X-Gemini-Meta', String(response.meta));
    headers.set('X-Gemini-Performance', JSON.stringify(response.timing));

    request.respond({
      status: 200,
      headers,
      body:new TextDecoder().decode(response.payload),
    });

  }
}
