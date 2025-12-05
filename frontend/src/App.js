import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import Join from "./Join";
import Chat from "./Chat";
import "./App.css";

// Single socket connection for the whole app
const socket = io.connect("http://localhost:5000");

function App() {
  const [showChat, setShowChat] = useState(false);
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  useEffect(() => {
    // Ask for notification permission
    if (Notification.permission !== "granted") Notification.requestPermission();
  }, []);

  const joinRoom = (user, roomId) => {
    if (!user || !roomId) return;

    setUsername(user);
    setRoom(roomId);

    // Emit join_room once here
    socket.emit("join_room", { username: user, room: roomId });

    setShowChat(true);
  };

  return (
    <div>
      {!showChat ? (
        <Join joinRoom={joinRoom} />
      ) : (
        <Chat socket={socket} username={username} room={room} />
      )}
    </div>
  );
}

export default App;
