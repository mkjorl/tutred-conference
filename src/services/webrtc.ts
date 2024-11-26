import { Device } from "mediasoup-client";
import { io, Socket } from "socket.io-client";
import "webrtc-adapter";

export class WebRTCService {
  private device: Device;
  private socket: Socket;
  private producerTransport: any;
  private consumerTransports: Map<string, any>;
  private producers: Map<string, any>;
  private consumers: Map<string, any>;
  private onStreamCallback: ((stream: MediaStream) => void) | null = null;

  constructor(roomId: string) {
    this.device = new Device();
    this.socket = io(
      import.meta.env.VITE_SIGNALING_SERVER ||
        "https://tutredstage-266226951372.herokuapp.com:3000",
      {
        query: { roomId },
        transports: ["websocket"],
      }
    );
    this.consumerTransports = new Map();
    this.producers = new Map();
    this.consumers = new Map();

    this.initializeSocketEvents();
  }

  public onStream(callback: (stream: MediaStream) => void) {
    this.onStreamCallback = callback;
  }

  private initializeSocketEvents() {
    this.socket.on("connect", () => {
      console.log("Connected to MediaSoup server");
    });

    this.socket.on("routerRtpCapabilities", async (routerRtpCapabilities) => {
      await this.device.load({ routerRtpCapabilities });
      await this.initializeTransports();
    });

    this.socket.on("newProducer", async ({ producerId, producerSocketId }) => {
      if (producerSocketId !== this.socket.id) {
        await this.connectConsumerTransport(producerId, producerSocketId);
      }
    });
  }

  private async initializeTransports() {
    return new Promise((resolve, reject) => {
      this.socket.emit("createProducerTransport", async (data: any) => {
        if (data.error) {
          reject(data.error);
          return;
        }

        try {
          this.producerTransport = this.device.createSendTransport(data);

          this.producerTransport.on(
            "connect",
            async ({ dtlsParameters }: any, callback: Function) => {
              this.socket.emit("connectProducerTransport", { dtlsParameters });
              callback();
            }
          );

          this.producerTransport.on(
            "produce",
            async (parameters: any, callback: Function) => {
              this.socket.emit("produce", parameters, (id: string) =>
                callback(id)
              );
            }
          );

          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async connectConsumerTransport(
    producerId: string,
    producerSocketId: string
  ) {
    const stream = new MediaStream();
    if (this.onStreamCallback) {
      this.onStreamCallback(stream);
    }
  }

  public async produceStream(stream: MediaStream) {
    if (!this.producerTransport) {
      throw new Error("Producer transport not initialized");
    }

    for (const track of stream.getTracks()) {
      const producer = await this.producerTransport.produce({ track });
      this.producers.set(track.kind, producer);
    }
  }

  public close() {
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());
    this.consumerTransports.forEach((transport) => transport.close());
    if (this.producerTransport) this.producerTransport.close();
    this.socket.close();
  }
}
