import dotenv from "dotenv";
import { app } from "./app.js";
import { connectDB } from "./db/db.js";
import { createServer } from "http";
import { initializeSocket } from "./socket/socket.js";

dotenv.config({ path: "./.env" });

connectDB()
  .then(() => {
    const server = createServer(app);
    
    // Initialize Socket.IO
    initializeSocket(server);
    
    server.listen(process.env.PORT, () => {
      console.log(`Server is running at port::${process.env.PORT}`);
    });
  })
  .catch((err) => console.log("MONGODB connection faild", err));
