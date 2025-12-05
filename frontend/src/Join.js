import React, { useState } from "react";

function Join({ joinRoom }) {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const generateRoomId = () => Math.random().toString(36).substring(2, 8);

  const handleJoin = () => {
    const roomId = room || generateRoomId();
    joinRoom(username, roomId);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>💬 Join Chat Room</h2>
      <input
        type="text"
        placeholder="Enter your name"
        onChange={(e) => setUsername(e.target.value)}
      />
      <br /><br />
      <input
        type="text"
        placeholder="Enter room ID (optional)"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      />
      <br /><br />
      <button onClick={handleJoin}>Join</button>
      <p style={{ marginTop: "10px" }}>
        Tip: Leave room blank to auto-generate.
      </p>
    </div>
  );
}

export default Join;
