import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";

// Support: -p 3010, --port 3010, or PORT=3010
function getPort(): number {
  const args = process.argv.slice(2);
  const pIdx = args.findIndex((a) => a === "-p" || a === "--port");
  if (pIdx !== -1 && args[pIdx + 1]) return parseInt(args[pIdx + 1], 10);
  return parseInt(process.env.PORT || "3000", 10);
}
const port = getPort();

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

interface RoomUser {
  id: string;
  username: string;
  avatar: string;
}

interface ChatMessage {
  id: string;
  username: string;
  avatar: string;
  english: string;
  pigLatin: string;
  timestamp: number;
}

const rooms = new Map<string, Map<string, RoomUser>>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    let currentUser: RoomUser | null = null;

    socket.on("join-room", (data: { room: string; username: string; avatar: string }) => {
      const { room, username, avatar } = data;

      // Leave previous room if any
      if (currentRoom) {
        socket.leave(currentRoom);
        const roomUsers = rooms.get(currentRoom);
        if (roomUsers) {
          roomUsers.delete(socket.id);
          if (roomUsers.size === 0) {
            rooms.delete(currentRoom);
          } else {
            io.to(currentRoom).emit("room-users", Array.from(roomUsers.values()));
            io.to(currentRoom).emit("user-left", { username: currentUser?.username });
          }
        }
      }

      currentRoom = room;
      currentUser = { id: socket.id, username, avatar };

      socket.join(room);

      if (!rooms.has(room)) {
        rooms.set(room, new Map());
      }
      rooms.get(room)!.set(socket.id, currentUser);

      const roomUsers = Array.from(rooms.get(room)!.values());
      io.to(room).emit("room-users", roomUsers);
      socket.to(room).emit("user-joined", { username });
    });

    socket.on("send-message", (data: { english: string; pigLatin: string }) => {
      if (!currentRoom || !currentUser) return;

      const message: ChatMessage = {
        id: `${socket.id}-${Date.now()}`,
        username: currentUser.username,
        avatar: currentUser.avatar,
        english: data.english,
        pigLatin: data.pigLatin,
        timestamp: Date.now(),
      };

      io.to(currentRoom).emit("new-message", message);
    });

    socket.on("typing", () => {
      if (!currentRoom || !currentUser) return;
      socket.to(currentRoom).emit("user-typing", { username: currentUser.username });
    });

    socket.on("leave-room", () => {
      if (!currentRoom || !currentUser) return;

      socket.leave(currentRoom);
      const roomUsers = rooms.get(currentRoom);
      if (roomUsers) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit("room-users", Array.from(roomUsers.values()));
          io.to(currentRoom).emit("user-left", { username: currentUser.username });
        }
      }

      currentRoom = null;
      currentUser = null;
    });

    socket.on("disconnect", () => {
      if (!currentRoom || !currentUser) return;

      const roomUsers = rooms.get(currentRoom);
      if (roomUsers) {
        roomUsers.delete(socket.id);
        if (roomUsers.size === 0) {
          rooms.delete(currentRoom);
        } else {
          io.to(currentRoom).emit("room-users", Array.from(roomUsers.values()));
          io.to(currentRoom).emit("user-left", { username: currentUser.username });
        }
      }
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Upidstay ready on http://${hostname}:${port}`);
  });
});
