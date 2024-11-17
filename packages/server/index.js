const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

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

io.on("connection", (socket) => {
  console.log("Client connected");

  let fileStream = null;

  socket.on("file-start", ({ filename }) => {
    console.log(`Starting file upload: ${filename}`);
    const filePath = path.join(UPLOAD_DIR, filename);
    fileStream = fs.createWriteStream(filePath);
  });

  socket.on("file-chunk", (chunk) => {
    if (fileStream) {
      fileStream.write(Buffer.from(chunk));
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

app.get("/", (req, res) => {
  res.send("Socket.IO File Upload Server is running");
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
