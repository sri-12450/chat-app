import React, { useState, useEffect, useRef } from "react";
import OnlineUsers from "./OnlineUsers";
import Picker from "emoji-picker-react";
import twemoji from "twemoji";
import "./Chat.css";

function Chat({ socket, username, room }) {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState(() => {
    const saved = localStorage.getItem(`chat_${room}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    const playModernNotificationSound = () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        // Modern chat tone — smooth & soft
        osc.type = "triangle";
        osc.frequency.setValueAtTime(520, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(340, audioCtx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      } catch (err) {
        console.warn("Sound play error:", err);
      }
    };

    const handleReceiveMessage = (data) => {
      setChat((list) => {
        const updated = [...list, data];
        localStorage.setItem(`chat_${room}`, JSON.stringify(updated));
        return updated;
      });

      if (data.author !== username) {
        // Desktop notification
        if (Notification.permission === "granted") {
          new Notification(`💬 ${data.author}:`, { body: data.message });
        }

        // Modern notification sound
        playModernNotificationSound();
      }
    };

    const handleTyping = ({ username: typing }) => {
      if (typing !== username) setTypingUser(typing);
      setTimeout(() => setTypingUser(""), 2000);
    };

    const handleOnlineUsers = (users) => setOnlineUsers(users);

    socket.on("receive_message", handleReceiveMessage);
    socket.on("typing", handleTyping);
    socket.on("online_users", handleOnlineUsers);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("typing", handleTyping);
      socket.off("online_users", handleOnlineUsers);
    };
  }, [socket, username, room]);

  useEffect(scrollToBottom, [chat]);

  useEffect(() => {
    twemoji.parse(document.body, { folder: "svg", ext: ".svg" });
  }, [chat]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const messageData = {
      room,
      author: username,
      message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", messageData);
    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
    socket.emit("typing", { username, room });
  };

  const onEmojiClick = (emojiData) => {
    setMessage(message + emojiData.emoji);
    setShowPicker(false);
  };

  const clearChat = () => {
    if (window.confirm("🧹 Are you sure you want to clear this chat?")) {
      localStorage.removeItem(`chat_${room}`);
      setChat([]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h2>Room: {room}</h2>

        <div className="header-right">
          <OnlineUsers users={onlineUsers} />
          <button className="clear-chat-btn" onClick={clearChat}>
            Clear Chat
          </button>
        </div>
      </div>

      {typingUser && (
        <div className="typing-indicator">{typingUser} is typing...</div>
      )}

      <div className="messages">
        {chat.map((msg, i) => (
          <div
            key={i}
            className={`message ${
              msg.author === username ? "my-message" : "other-message"
            }`}
          >
            <div className="message-info">
              <strong>{msg.author}</strong> <span>{msg.time}</span>
            </div>
            <p
              dangerouslySetInnerHTML={{
                __html: twemoji.parse(msg.message, {
                  folder: "svg",
                  ext: ".svg",
                }),
              }}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={handleKeyPress}
        />

        <div
          className={`emoji-toggle-btn ${showPicker ? "active" : ""}`}
          onClick={() => setShowPicker(!showPicker)}
        >
          <span>😊</span>
        </div>

        <button onClick={sendMessage}>Send</button>
      </div>

      {showPicker && (
        <div className="emoji-picker">
          <Picker
            onEmojiClick={onEmojiClick}
            lazyLoadEmojis
            disableAutoFocus
            skinTonesDisabled
            searchDisabled
            emojiStyle="google"
            width={320}
            height={400}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;
