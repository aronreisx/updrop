import express, { Request, Response } from "express";
import http from "http";
import { Server, Socket } from "socket.io";
import fs from "fs";
import path from "path";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for development; restrict in production
  },
});

const UPLOAD_DIR = path.join(__dirname, "uploads");

// Ensure the uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Define interfaces for socket events
interface FileStartData {
  filename: string;
}

io.on("connection", (socket: Socket) => {
  console.log("Client connected");

  let fileStream: fs.WriteStream | null = null;

  socket.on("file-start", ({ filename }: FileStartData) => {
    console.log(`Starting file upload: ${filename}`);
    const filePath = path.join(UPLOAD_DIR, filename);
    fileStream = fs.createWriteStream(filePath);
  });

  socket.on("file-chunk", (chunk: Buffer) => {
    if (fileStream) {
      fileStream.write(chunk);
    }
  });

  socket.on("file-end", () => {
    if (fileStream) {
      fileStream.end();
      fileStream = null;
      console.log("File upload completed.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    if (fileStream) {
      fileStream.end();
      fileStream = null;
    }
  });
});

app.get("/", (req: Request, res: Response) => {
  res.send("Socket.IO File Upload Server is running");
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
