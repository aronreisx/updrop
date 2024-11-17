import { useState, ChangeEvent } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io("http://localhost:3001");

export function App() {
  const [progress, setProgress] = useState<number>(0);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log(`Uploading: ${file.name}`);
    const CHUNK_SIZE = 64 * 1024; // 64KB

    socket.emit("file-start", { filename: file.name });

    let offset = 0;

    while (offset < file.size) {
      const chunk = file.slice(offset, offset + CHUNK_SIZE);
      const arrayBuffer = await chunk.arrayBuffer();
      socket.emit("file-chunk", arrayBuffer);

      offset += CHUNK_SIZE;

      // Calculate progress at each step
      const progress = Math.min(
        Number(((offset / file.size) * 100).toFixed(2)),
        100
      );
      setProgress(parseFloat(String(progress)));
    }

    socket.emit("file-end");
    console.log("File upload completed.");
  };

  return (
    <div>
      <h1>File Uploader</h1>
      <input type="file" onChange={handleFileUpload} />
      {progress > 0 && <p>Upload Progress: {progress}%</p>}
    </div>
  );
}
