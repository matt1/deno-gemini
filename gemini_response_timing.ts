export class GeminiResponseTiming {
  /**
   * 
   * @param startMillis Timestamp when request started, before any connection has been attemted.
   * @param writeStartMillis Timestamp when write to socket started after successful connection.
   * @param readStartMillis Timestamp when read from socket started. 
   * @param readCompleteMillis Timestamp when read stopped.
   */
   constructor(readonly startMillis:number, readonly writeStartMillis:number,
    readonly readStartMillis:number, readonly readCompleteMillis:number){}

  /** Total duration of the request. */
  public get totalDurationMillis() : number {
    return this.readCompleteMillis - this.startMillis;
  }

  /** Total time spent waiting for connection */
  public get waitingDurationMillis() : number {
    return this.writeStartMillis - this.startMillis;
  }

  /** Total time spent waiting for first byte. */
  public get waitingForFirstByteDurationMillis() : number {
    return this.readStartMillis - this.writeStartMillis;
  }

  /** Total time spent recieving data. */
  public get recievingDuratrionMillis() : number {
    return this.readCompleteMillis - this.readStartMillis;
  }
}