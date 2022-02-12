export const INPUT = 10;
export const SENSITIVE_INPUT = 11;
export const SUCCESS = 20;
export const REDIRECT_TEMPORARY = 30;
export const REDIRECT_PERMANENT = 31;
export const TEMPORARY_FAILURE = 40;
export const SERVER_UNAVAILABLE = 41;
export const CGI_ERROR = 42;
export const PROXY_ERROR = 43;
export const SLOW_DOWN = 44;
export const PERMANENT_FAILURE = 50;
export const NOT_FOUND = 51;
export const GONE = 52;
export const PROXY_REQUEST_REFUSED = 53;
export const BAD_REQUEST = 59;
export const CLIENT_CERTIFICATE_REQUIRED = 60;
export const CERTIFICATE_NOT_AUTHORISED = 61;
export const CERTIFICATE_NT_VALID = 62;



export const GeminiStatuses = new Map<Number, String>([
  [10, 'INPUT'],
  [11, 'SENSITIVE INPUT'],
  [20, 'SUCCESS'],
  [30, 'REDIRECT - TEMPORARY'],
  [31, 'REDIRECT - PERMANENT'],
  [40, 'TEMPORARY FAILURE'],
  [41, 'SERVER UNAVAILABLE'],
  [42, 'CGI ERROR'],
  [43, 'PROXY ERROR'],
  [44, 'SLOW DOWN'],
  [50, 'PERMANENT FAILURE'],
  [51, 'NOT FOUND'],
  [52, 'GONE'],
  [53, 'PROXY REQUEST REFUSED'],
  [59, 'BAD REQUEST'],
  [60, 'CLIENT CERTIFICATE REQUIRED'],
  [61, 'CERTIFICATE NOT AUTHORISED'],
  [62, 'CERTIFICATE NOT VALID'],
]);
