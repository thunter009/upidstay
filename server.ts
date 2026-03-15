import { createServer } from "http";
import { resolve } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import next from "next";
import { Server } from "socket.io";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const initSqlJs = require("sql.js");

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

// --- SQLite setup ---
const dbPath = resolve(process.env.DB_PATH || "data/chat.db");
const dataDir = resolve(dbPath, "..");
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlDb: any;

async function initDb() {
  const SQL = await initSqlJs();
  if (existsSync(dbPath)) {
    const buf = readFileSync(dbPath);
    sqlDb = new SQL.Database(buf);
  } else {
    sqlDb = new SQL.Database();
  }
  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT NOT NULL,
      english TEXT NOT NULL,
      pig_latin TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_room_ts ON messages(room, timestamp);
  `);
  saveDb();
}

function saveDb() {
  const data = sqlDb.export();
  writeFileSync(dbPath, Buffer.from(data));
}

function insertMessage(room: string, msg: ChatMessage) {
  sqlDb.run(
    `INSERT OR IGNORE INTO messages (id, room, username, avatar, english, pig_latin, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [msg.id, room, msg.username, msg.avatar, msg.english, msg.pigLatin, msg.timestamp]
  );
  saveDb();
}

function loadHistory(room: string): ChatMessage[] {
  const results = sqlDb.exec(
    `SELECT id, username, avatar, english, pig_latin, timestamp
     FROM messages WHERE room = ? ORDER BY timestamp DESC LIMIT 100`,
    [room]
  );
  if (!results.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return results[0].values
    .map((row: any[]) => ({
      id: row[0] as string,
      username: row[1] as string,
      avatar: row[2] as string,
      english: row[3] as string,
      pigLatin: row[4] as string,
      timestamp: row[5] as number,
    }))
    .reverse();
}

function getKnownRooms(): string[] {
  const results = sqlDb.exec(
    `SELECT room, MAX(timestamp) as last_ts FROM messages GROUP BY room ORDER BY last_ts DESC LIMIT 50`
  );
  if (!results.length) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return results[0].values.map((row: any[]) => row[0] as string);
}

// --- In-memory buffer ---
const BUFFER_SIZE = 100;
const messageBuffers = new Map<string, ChatMessage[]>();

function getBuffer(room: string): ChatMessage[] {
  if (!messageBuffers.has(room)) {
    messageBuffers.set(room, loadHistory(room));
  }
  return messageBuffers.get(room)!;
}

function pushMessage(room: string, message: ChatMessage) {
  const buf = getBuffer(room);
  buf.push(message);
  if (buf.length > BUFFER_SIZE) buf.shift();
  insertMessage(room, message);
}

// --- Rooms ---
const rooms = new Map<string, Map<string, RoomUser>>();

async function main() {
  await initDb();
  await app.prepare();

  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  function buildRoomList() {
    const seen = new Set<string>();
    const list: { name: string; count: number }[] = [];

    // Active rooms (with users)
    for (const [name, users] of rooms) {
      seen.add(name);
      list.push({ name, count: users.size });
    }

    // Rooms with history but no active users
    for (const name of getKnownRooms()) {
      if (!seen.has(name)) {
        list.push({ name, count: 0 });
      }
    }

    return list;
  }

  function broadcastRoomList() {
    io.emit("room-list", buildRoomList());
  }

  io.on("connection", (socket) => {
    let currentRoom: string | null = null;
    let currentUser: RoomUser | null = null;

    // Send current room list on connect
    socket.emit("room-list", buildRoomList());

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

      // Send chat history to the joining user
      const history = getBuffer(room);
      if (history.length > 0) {
        socket.emit("message-history", history);
      }

      const roomUsers = Array.from(rooms.get(room)!.values());
      io.to(room).emit("room-users", roomUsers);
      socket.to(room).emit("user-joined", { username });
      broadcastRoomList();
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

      pushMessage(currentRoom, message);
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
      broadcastRoomList();
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
      broadcastRoomList();
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`> Upidstay ready on http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
