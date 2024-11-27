import { WebRTCService } from "./webrtc";

export class MediaServer {
  private webrtcService: WebRTCService | null = null;
  private static instance: MediaServer;
  private remoteStreamHandlers: ((stream: MediaStream) => void)[] = [];
  private errorHandlers: ((error: Error) => void)[] = [];

  private constructor() {}

  public static getInstance(): MediaServer {
    if (!MediaServer.instance) {
      MediaServer.instance = new MediaServer();
    }
    return MediaServer.instance;
  }

  public async joinRoom(roomId: string) {
    if (this.webrtcService) {
      this.webrtcService.close();
    }
    this.webrtcService = new WebRTCService(roomId);

    // Set up remote stream handling
    this.webrtcService.onStream((stream) => {
      this.remoteStreamHandlers.forEach((handler) => handler(stream));
    });

    return this.webrtcService;
  }

  public async produceStream(stream: MediaStream) {
    console.log("produceStream", stream);
    if (!this.webrtcService) {
      throw new Error("Must join room before producing stream");
    }
    await this.webrtcService.produceStream(stream);
  }

  public onRemoteStream(handler: (stream: MediaStream) => void) {
    this.remoteStreamHandlers.push(handler);
  }

  public offRemoteStream(handler: (stream: MediaStream) => void) {
    this.remoteStreamHandlers = this.remoteStreamHandlers.filter(
      (h) => h !== handler
    );
  }

  public onRemoteStreamError(handler: (error: Error) => void) {
    this.errorHandlers.push(handler);
  }

  public offRemoteStreamError(handler: (error: Error) => void) {
    this.errorHandlers = this.errorHandlers.filter((h) => h !== handler);
  }

  public leaveRoom() {
    if (this.webrtcService) {
      this.webrtcService.close();
      this.webrtcService = null;
    }
    // Clear all handlers
    this.remoteStreamHandlers = [];
    this.errorHandlers = [];
  }
}
