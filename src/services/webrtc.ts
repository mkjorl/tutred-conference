import { Device } from "mediasoup-client";
import { io, Socket } from "socket.io-client";
import "webrtc-adapter";

export class WebRTCService {
  private device: Device;
  private socket: Socket;
  private producerTransport: any;
  private consumerTransport: any;
  private producers: Map<string, any>;
  private consumers: Map<string, any>;
  private onStreamCallback: ((stream: MediaStream) => void) | null = null;
  private mediaStream: MediaStream | null = null;

  constructor(roomId: string) {
    this.device = new Device();
    this.socket = io(
      import.meta.env.VITE_SIGNALING_SERVER ||
        "https://tutredstage-266226951372.herokuapp.com",
      {
        query: { roomId },
        transports: ["websocket"],
      }
    );
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
        await this.consume(producerId);
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
            async ({ kind, rtpParameters }: any, callback: Function) => {
              this.socket.emit(
                "produce",
                { kind, rtpParameters },
                (id: string) => callback(id)
              );
            }
          );

          // Initialize consumer transport
          this.socket.emit("createConsumerTransport", async (data: any) => {
            if (data.error) {
              reject(data.error);
              return;
            }

            this.consumerTransport = this.device.createRecvTransport(data);

            this.consumerTransport.on(
              "connect",
              ({ dtlsParameters }: any, callback: Function) => {
                this.socket.emit("connectConsumerTransport", {
                  dtlsParameters,
                });
                callback();
              }
            );

            resolve(true);
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  private async consume(producerId: string) {
    this.socket.emit(
      "consume",
      {
        producerId,
        rtpCapabilities: this.device.rtpCapabilities,
      },
      async ({ id, kind, rtpParameters }: any) => {
        const consumer = await this.consumerTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
        });

        this.consumers.set(consumer.id, consumer);

        const track = consumer.track;
        if (!this.mediaStream) {
          this.mediaStream = new MediaStream();
          if (this.onStreamCallback) {
            this.onStreamCallback(this.mediaStream);
          }
        }
        this.mediaStream.addTrack(track);

        this.socket.emit("resumeConsumer", { consumerId: consumer.id });
      }
    );
  }

  public async produceStream(stream: MediaStream) {
    if (!this.producerTransport) {
      throw new Error("Producer transport not initialized");
    }

    for (const track of stream.getTracks()) {
      const producer = await this.producerTransport.produce({ track });
      this.producers.set(track.kind, producer);

      producer.on("trackended", () => {
        producer.close();
        this.producers.delete(track.kind);
      });
    }
  }

  public close() {
    this.producers.forEach((producer) => producer.close());
    this.consumers.forEach((consumer) => consumer.close());
    if (this.producerTransport) this.producerTransport.close();
    if (this.consumerTransport) this.consumerTransport.close();
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
    this.socket.close();
  }
}
