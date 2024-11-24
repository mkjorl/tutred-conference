import { Device } from 'mediasoup-client';
import { io, Socket } from 'socket.io-client';
import 'webrtc-adapter';

export class WebRTCService {
  private device: Device;
  private socket: Socket;
  private producerTransport: any;
  private consumerTransports: Map<string, any>;
  private producers: Map<string, any>;
  private consumers: Map<string, any>;

  constructor(roomId: string) {
    this.device = new Device();
    this.socket = io(import.meta.env.VITE_SIGNALING_SERVER || 'http://localhost:3000');
    this.consumerTransports = new Map();
    this.producers = new Map();
    this.consumers = new Map();

    this.initializeSocketEvents(roomId);
  }

  private initializeSocketEvents(roomId: string) {
    this.socket.on('connect', () => {
      this.socket.emit('joinRoom', { roomId });
    });

    this.socket.on('routerRtpCapabilities', async (routerRtpCapabilities) => {
      await this.device.load({ routerRtpCapabilities });
      this.initializeTransports();
    });

    this.socket.on('newProducer', async ({ producerId, producerSocketId }) => {
      await this.connectConsumerTransport(producerId, producerSocketId);
    });
  }

  private async initializeTransports() {
    // Request server to create producer transport
    this.socket.emit('createProducerTransport', async (data: any) => {
      this.producerTransport = this.device.createSendTransport(data);
      
      this.producerTransport.on('connect', async ({ dtlsParameters }: any, callback: Function) => {
        this.socket.emit('connectProducerTransport', { dtlsParameters });
        callback();
      });

      this.producerTransport.on('produce', async (parameters: any, callback: Function) => {
        this.socket.emit('produce', parameters, (id: string) => callback(id));
      });
    });
  }

  private async connectConsumerTransport(producerId: string, producerSocketId: string) {
    // Request server to create consumer transport
    this.socket.emit('createConsumerTransport', async (data: any) => {
      const consumerTransport = this.device.createRecvTransport(data);
      
      consumerTransport.on('connect', ({ dtlsParameters }: any, callback: Function) => {
        this.socket.emit('connectConsumerTransport', {
          dtlsParameters,
          serverConsumerTransportId: data.id,
        });
        callback();
      });

      this.consumerTransports.set(producerSocketId, consumerTransport);
      await this.connectConsumer(producerId, producerSocketId);
    });
  }

  private async connectConsumer(producerId: string, producerSocketId: string) {
    const consumerTransport = this.consumerTransports.get(producerSocketId);
    
    this.socket.emit('consume', {
      rtpCapabilities: this.device.rtpCapabilities,
      producerId,
      serverConsumerTransportId: consumerTransport.id,
    }, async ({ id, kind, rtpParameters }: any) => {
      const consumer = await consumerTransport.consume({
        id,
        producerId,
        kind,
        rtpParameters,
      });

      this.consumers.set(producerSocketId, consumer);
      this.socket.emit('resumeConsumer', { serverConsumerId: id });
    });
  }

  public async produceStream(stream: MediaStream) {
    for (const track of stream.getTracks()) {
      const producer = await this.producerTransport.produce({ track });
      this.producers.set(track.kind, producer);
    }
  }

  public close() {
    this.producers.forEach(producer => producer.close());
    this.consumers.forEach(consumer => consumer.close());
    this.consumerTransports.forEach(transport => transport.close());
    if (this.producerTransport) this.producerTransport.close();
    this.socket.close();
  }
}