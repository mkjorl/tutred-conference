import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import * as mediasoup from "mediasoup";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

// Socket.IO setup with CORS and logging
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  logger: {
    debug: (...args) => console.debug("socket.io debug:", ...args),
    info: (...args) => console.info("socket.io info:", ...args),
    warn: (...args) => console.warn("socket.io warn:", ...args),
    error: (...args) => console.error("socket.io error:", ...args),
  },
});

// MediaSoup setup
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

// Socket.IO event handling
io.on("connection", async (socket) => {
  const { roomId } = socket.handshake.query;
  console.log("Client connected:", socket.id, "Room:", roomId);

  socket.join(roomId);

  // Handle room creation/joining
  if (!rooms.has(roomId)) {
    await createRoom(roomId);
  }
  const room = rooms.get(roomId);

  // Send router RTP capabilities
  socket.emit("routerRtpCapabilities", room.router.rtpCapabilities);

  // Handle transport creation
  socket.on("createProducerTransport", async (callback) => {
    try {
      const transport = await createWebRtcTransport(room.router);
      room.peers.set(socket.id, {
        ...room.peers.get(socket.id),
        producerTransport: transport,
      });

      console.log("transport", transport);

      callback({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    } catch (err) {
      console.error("Error creating producer transport:", err);
      callback({ error: err.message });
    }
  });

  // Handle transport connection
  socket.on("connectProducerTransport", async ({ dtlsParameters }) => {
    const peer = room.peers.get(socket.id);
    if (peer?.producerTransport) {
      await peer.producerTransport.connect({ dtlsParameters });
    }
  });

  // Handle stream production
  socket.on("produce", async ({ kind, rtpParameters }, callback) => {
    const peer = room.peers.get(socket.id);
    if (peer?.producerTransport) {
      const producer = await peer.producerTransport.produce({
        kind,
        rtpParameters,
      });
      peer.producers = peer.producers || new Map();
      peer.producers.set(kind, producer);

      // Notify other peers about new producer
      socket.to(roomId).emit("newProducer", {
        producerId: producer.id,
        producerSocketId: socket.id,
      });

      callback(producer.id);
    }
  });

  // Handle canvas updates
  socket.on("canvas:update", (update) => {
    socket.to(roomId).emit("canvas:update", update);
  });

  // Handle canvas open events
  socket.on("canvas:open", (update) => {
    socket.to(roomId).emit("canvas:open", update);
  });

  // Handle code updates
  socket.on("code:update", (update) => {
    socket.to(roomId).emit("code:update", update);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const peer = room.peers.get(socket.id);
    if (peer) {
      peer.producers?.forEach((producer) => producer.close());
      peer.producerTransport?.close();
      room.peers.delete(socket.id);
    }

    // Clean up room if empty
    if (room.peers.size === 0) {
      rooms.delete(roomId);
    }

    console.log("Client disconnected:", socket.id);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
createWorker().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
