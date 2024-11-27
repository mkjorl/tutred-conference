import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import * as mediasoup from "mediasoup";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let worker;
const rooms = new Map();

const createWorker = async () => {
  worker = await mediasoup.createWorker({
    logLevel: "warn",
    rtcMinPort: 2000,
    rtcMaxPort: 2020,
  });
  console.log("MediaSoup Worker created");
  return worker;
};

const createWebRtcTransport = async (router) => {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: process.env.MEDIASOUP_LISTEN_IP || "0.0.0.0",
        announcedIp: process.env.MEDIASOUP_ANNOUNCED_IP || "127.0.0.1",
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
  });
  return transport;
};

const createRoom = async (roomId) => {
  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: {
          "x-google-start-bitrate": 1000,
        },
      },
    ],
  });

  rooms.set(roomId, { router, peers: new Map() });
  return router;
};

io.on("connection", async (socket) => {
  const { roomId } = socket.handshake.query;
  console.log("Client connected:", socket.id, "Room:", roomId);

  socket.join(roomId);

  if (!rooms.has(roomId)) {
    await createRoom(roomId);
  }
  const room = rooms.get(roomId);

  socket.emit("routerRtpCapabilities", room.router.rtpCapabilities);

  socket.on("createProducerTransport", async (callback) => {
    try {
      const transport = await createWebRtcTransport(room.router);
      room.peers.set(socket.id, {
        ...room.peers.get(socket.id),
        producerTransport: transport,
      });

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("createConsumerTransport", async (callback) => {
    try {
      const transport = await createWebRtcTransport(room.router);
      room.peers.set(socket.id, {
        ...room.peers.get(socket.id),
        consumerTransport: transport,
      });

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      callback({ error: err.message });
    }
  });

  socket.on("connectProducerTransport", async ({ dtlsParameters }) => {
    const peer = room.peers.get(socket.id);
    if (peer?.producerTransport) {
      await peer.producerTransport.connect({ dtlsParameters });
    }
  });

  socket.on("connectConsumerTransport", async ({ dtlsParameters }) => {
    const peer = room.peers.get(socket.id);
    if (peer?.consumerTransport) {
      await peer.consumerTransport.connect({ dtlsParameters });
    }
  });

  socket.on("produce", async ({ kind, rtpParameters }, callback) => {
    const peer = room.peers.get(socket.id);
    if (peer?.producerTransport) {
      const producer = await peer.producerTransport.produce({
        kind,
        rtpParameters,
      });
      peer.producers = peer.producers || new Map();
      peer.producers.set(kind, producer);

      socket.to(roomId).emit("newProducer", {
        producerId: producer.id,
        producerSocketId: socket.id,
      });

      callback(producer.id);
    }
  });

  socket.on("consume", async ({ producerId, rtpCapabilities }, callback) => {
    try {
      const peer = room.peers.get(socket.id);
      if (!peer?.consumerTransport) return;

      const consumer = await peer.consumerTransport.consume({
        producerId,
        rtpCapabilities,
        paused: true,
      });

      peer.consumers = peer.consumers || new Map();
      peer.consumers.set(consumer.id, consumer);

      callback({
        id: consumer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        producerId: producerId,
      });
    } catch (err) {
      console.error("Consume error:", err);
      callback({ error: err.message });
    }
  });

  socket.on("resumeConsumer", async ({ consumerId }) => {
    const peer = room.peers.get(socket.id);
    const consumer = peer?.consumers?.get(consumerId);
    if (consumer) {
      await consumer.resume();
    }
  });

  socket.on("disconnect", () => {
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.producers?.forEach((producer) => producer.close());
      peer.consumers?.forEach((consumer) => consumer.close());
      peer.producerTransport?.close();
      peer.consumerTransport?.close();
      room.peers.delete(socket.id);
    }

    if (room.peers.size === 0) {
      rooms.delete(roomId);
    }

    console.log("Client disconnected:", socket.id);
  });

  // Handle other socket events (canvas, code, etc.)
  socket.on("canvas:update", (update) => {
    socket.to(roomId).emit("canvas:update", update);
  });

  socket.on("canvas:open", (update) => {
    socket.to(roomId).emit("canvas:open", update);
  });

  socket.on("code:update", (update) => {
    socket.to(roomId).emit("code:update", update);
  });
});

const PORT = process.env.PORT || 3000;
createWorker().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
