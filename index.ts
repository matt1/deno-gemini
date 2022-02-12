import {GeminiClient, GeminiRequest, GeminiResponse, GeminiStatuses} from './mod.ts';

const gemini = new GeminiClient();
const request = new GeminiRequest(new URL(`gemini://gemini.conman.org/test/torture/`));

try {
  const response = await gemini.transaction(request);

  console.log(new TextDecoder().decode(response.payload));
  console.log(`Status: ${response.status} / ${GeminiStatuses.get(response.status)}`);
  console.log(`Meta: '${response.meta}'`);
  console.log(`Timing info for Gemini Request:
    Waiting for connection: ${response.timing.waitingDurationMillis}ms
    Waiting for first byte: ${response.timing.waitingForFirstByteDurationMillis}ms
    Receiving time:         ${response.timing.recievingDuratrionMillis}ms
    Total request duration: ${response.timing.totalDurationMillis}ms`);

} catch (error) {
  console.log(`Error from client: ${error}`);
}
