import { WebRTCService } from './webrtc';

export class MediaServer {
  private webrtcService: WebRTCService | null = null;
  private static instance: MediaServer;

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
    return this.webrtcService;
  }

  public async produceStream(stream: MediaStream) {
    if (!this.webrtcService) {
      throw new Error('Must join room before producing stream');
    }
    await this.webrtcService.produceStream(stream);
  }

  public leaveRoom() {
    if (this.webrtcService) {
      this.webrtcService.close();
      this.webrtcService = null;
    }
  }
}