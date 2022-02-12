import {assertEquals, assertThrows} from 'https://deno.land/std/testing/asserts.ts';
import {GeminiResponse} from './gemini_response.ts';
import { GeminiResponseTiming} from './gemini_response_timing.ts';

import {CRLF} from './gemini_utils.ts';

const DUMMY_TIMING = new GeminiResponseTiming(1, 2, 3, 4);

Deno.test('GopherResponse handles normal responses', () => {
  const payload = new TextEncoder().encode(`20 text/gemini${CRLF}Hello`);
  const response = new GeminiResponse(payload, DUMMY_TIMING);

  assertEquals(20, response.status);
  assertEquals('text/gemini', response.meta);
  assertEquals('Hello', new TextDecoder().decode(response.payload));
});

Deno.test('GopherResponse handles extended metadata', () => {
  const payload = new TextEncoder().encode(`20 extended metadata that might be quite long with odd characters !"£$%^&*()_+{}@~><?${CRLF}Hello`);
  const response = new GeminiResponse(payload, DUMMY_TIMING);

  assertEquals(20, response.status);
  assertEquals('extended metadata that might be quite long with odd characters !"£$%^&*()_+{}@~><?', response.meta);
  assertEquals('Hello', new TextDecoder().decode(response.payload));
});

Deno.test('GopherResponse errors on malformed response', () => {
  // blank
  let payload = new TextEncoder().encode(``);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));
  payload = new TextEncoder().encode(` `);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));

  // No meta
  payload = new TextEncoder().encode(`20`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));

  // No meta end
  payload = new TextEncoder().encode(`20 no newline`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));

  // No space betwen status and meta
  payload = new TextEncoder().encode(`20nospace`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));

  // Unrecognised status
  payload = new TextEncoder().encode(`200 meta${CRLF}Hello`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));
  payload = new TextEncoder().encode(`2 meta${CRLF}Hello`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));
  payload = new TextEncoder().encode(`99 meta${CRLF}Hello`);
  assertThrows(() => new GeminiResponse(payload, DUMMY_TIMING));
});
