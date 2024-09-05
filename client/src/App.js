import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";

const socket = io("https://chat-app-4exi.onrender.com/");

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [isJoined, setIsJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [privateRecipient, setPrivateRecipient] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    socket.on("chat message", (msg) => {
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    socket.on("user joined", (user) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { system: true, message: `${user} joined the chat` },
      ]);
    });

    socket.on("user left", (user) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { system: true, message: `${user} left the chat` },
      ]);
    });

    socket.on("update users", (updatedUsers) => {
      setUsers(updatedUsers);
    });

    socket.on("private message", ({ from, message }) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        { user: from, message, private: true },
      ]);
    });

    socket.on("user typing", ({ user, isTyping }) => {
      setTypingUsers((prevTypingUsers) =>
        isTyping
          ? [...new Set([...prevTypingUsers, user])]
          : prevTypingUsers.filter((u) => u !== user)
      );
    });

    return () => {
      socket.off("chat message");
      socket.off("user joined");
      socket.off("user left");
      socket.off("update users");
      socket.off("private message");
      socket.off("user typing");
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (input) {
      if (privateRecipient) {
        socket.emit("private message", {
          to: privateRecipient,
          message: input,
        });
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            user: username,
            message: input,
            private: true,
            to: privateRecipient,
          },
        ]);
      } else {
        socket.emit("chat message", input);
      }
      setInput("");
      setPrivateRecipient(null);
    }
  };

  const joinChat = (e) => {
    e.preventDefault();
    if (username) {
      socket.emit("set username", username);
      setIsJoined(true);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit("typing", e.target.value.length > 0);
  };

  const addEmoji = (emoji) => {
    setInput(input + emoji.native);
    setShowEmojiPicker(false);
  };

  if (!isJoined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md">
          <form
            onSubmit={joinChat}
            className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
          >
            <div className="mb-4">
              <input
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                type="submit"
              >
                Join Chat
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/4 bg-white p-4 border-r">
        <h2 className="text-xl font-bold mb-4">Active Users</h2>
        <ul>
          {users.map((user) => (
            <li
              key={user.id}
              className="cursor-pointer hover:bg-gray-200 p-2 rounded"
              onClick={() => setPrivateRecipient(user.username)}
            >
              {user.username}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-2 ${msg.private ? "text-purple-600" : ""}`}
            >
              {msg.system ? (
                <em className="text-gray-600">{msg.message}</em>
              ) : (
                <>
                  <strong className="text-blue-600">{msg.user}: </strong>
                  <span>{msg.message}</span>
                  {msg.private && (
                    <span className="text-xs ml-2">(Private)</span>
                  )}
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {typingUsers.length > 0 && (
          <div className="text-gray-500 italic p-2">
            {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
            typing...
          </div>
        )}
        <form onSubmit={sendMessage} className="flex p-4 bg-white">
          <input
            className="flex-1 border rounded-l py-2 px-3 text-gray-700 focus:outline-none"
            value={input}
            onChange={handleInputChange}
            placeholder={
              privateRecipient
                ? `Private message to ${privateRecipient}`
                : "Type a message"
            }
          />
          <button
            type="button"
            className="bg-yellow-400 text-yellow-900 px-4 py-2"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            😊
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-r"
            type="submit"
          >
            Send
          </button>
        </form>
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-4">
            <Picker onSelect={addEmoji} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
