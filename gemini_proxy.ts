import { Application, Router, RouterContext} from "https://deno.land/x/oak/mod.ts";

import {GeminiClient} from "./gemini_client.ts";
import { GeminiRequest } from "./gemini_request.ts";
import { GeminiResponse } from "./gemini_response.ts";

const PORT = Number(Deno.env.get('port')) || 1965;
const PROXY_RELATIVE_URL = "/gemini/";
const URL_PARAM_REGEX = /^\/gemini:\/\/(.*)$/;


/** A simple Gemini-over-HTTPS proxy. */
export class GeminiProxy {
//  readonly server: Server;
  readonly geminiClient: GeminiClient;
  readonly app: Application;

  constructor() {
    this.geminiClient = new GeminiClient();
    const router = new Router({
      strict: true,
    });
    router.get("/", (ctx) => {
      ctx.response.body = "Hello world!";
    });
    router.get(`${PROXY_RELATIVE_URL}:url([\\w\\d\\.\\-_\/~]+)`, async (ctx) => {
      console.log(`Serving proxy request for ${ctx.params.url}`);
      await this.handleRequest(ctx);
    });
    
    this.app = new Application();
    this.app.use(router.routes());
    this.app.use(router.allowedMethods());

    this.app.use((ctx) => {
      ctx.response.status = 404;
      ctx.response.body = "404";
  });
    
    this.app.addEventListener("listen", (e) => {
      console.log(`Listening on ${PORT}`);
    });
   
  }

  serve() {
    this.app.listen({ port: PORT });
  }

  async handleRequest(ctx:RouterContext<"/gemini/:url([\\w\\d\\.\\-_\/~]+)", {
    url: string;
} & Record<string | number, string | undefined>, Record<string, any>>) {
    let geminiResponse: GeminiResponse;

    try {
      const url = new URL(`gemini://${ctx.params.url}`);
      const request = new GeminiRequest(url);

      ctx.response.headers.set('Content-Type', 'text/plain; charset=utf-8');
      ctx.response.headers.set('Via', `Gemini 0.16.1 ${url.hostname}`)
      ctx.response.headers.append("access-control-allow-origin", "*");
      ctx.response.headers.append(
        "access-control-allow-headers",
        "Origin, X-Requested-With, Content-Type, Accept, Range",
      );

      geminiResponse = await this.geminiClient.transaction(request);

    } catch (error) {
      console.log(`Error from client: ${error}`);
      console.warn(`Error making gemini request ${error}`);
      ctx.response.status = 500;
      ctx.response.body = `500 Error: unable to complete gemini request '${error}'.`
      return;
    }

    ctx.response.headers.set('X-Gemini-Status', String(geminiResponse.status));
    ctx.response.headers.set('X-Gemini-Meta', String(geminiResponse.meta));
    ctx.response.headers.set('X-Gemini-Performance', JSON.stringify(geminiResponse.timing));

    switch (geminiResponse.status) {
      case 20:
        ctx.response.status = 200;
        ctx.response.body = new TextDecoder().decode(geminiResponse.payload);
        break;
      case 30:  // temporary redirect
        ctx.response.status = 302;
        ctx.response.headers.set('Location', this.geminiUrlToProxyUrl(String(geminiResponse.meta)));
        break;
      case 31:  // permanent redirect
        ctx.response.status = 301;
        ctx.response.headers.set('Location', this.geminiUrlToProxyUrl(String(geminiResponse.meta)));
        break;
      case 40:  // temporary server failure
      case 41:  // server unavailable
        ctx.response.status = 503;
        ctx.response.body = geminiResponse.meta;
        break;
      case 44:  // slow down
        ctx.response.status = 429;
        ctx.response.body = geminiResponse.meta;
        ctx.response.headers.set('Retry-After', String(geminiResponse.meta));
        break;
      case 51:  // not found
        ctx.response.status = 404;
        ctx.response.body = geminiResponse.meta;
        break;
      case 52:  // gone
        ctx.response.status = 410;
        ctx.response.body = geminiResponse.meta;
        break;
      case 59:  // bad request
        ctx.response.status = 400;
        ctx.response.body = geminiResponse.meta;
        break;
      case 60:  // client cert required
      case 61:  // cert not authorised
      case 62:  // cert not valid
        ctx.response.status = 400;
        ctx.response.body = geminiResponse.meta;
        break;
    }


  }

  /** Convert an absolute gemini URL to a proxy URL. Usefor for HTTP redirects etc. */
  private geminiUrlToProxyUrl(url:string): string {
    if (url.startsWith('gemini://')) {
      return `${PROXY_RELATIVE_URL}${url.substring(9)}`;
    }
    return `${PROXY_RELATIVE_URL}${url}`;
  }
}
