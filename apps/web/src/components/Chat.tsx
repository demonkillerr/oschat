"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import { getSocket } from '../lib/socket';
import { socketEvents } from '@oschat/shared';

type Message = { id: string; user: string; text: string; ts: number };

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState('you');
  const listRef = useRef<HTMLDivElement | null>(null);

  const socket = useMemo(() => getSocket(), []);

  useEffect(() => {
    const onNew = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 0);
    };
    socket.on(socketEvents.ChatNew, onNew);
    return () => {
      socket.off(socketEvents.ChatNew, onNew);
    };
  }, [socket]);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit(socketEvents.ChatSend, { user, text: trimmed });
    setText('');
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send();
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="name" style={{ flex: '0 0 160px' }} />
        <input value={text} onKeyDown={onKey} onChange={(e) => setText(e.target.value)} placeholder="type a message" style={{ flex: 1 }} />
        <button onClick={send}>Send</button>
      </div>
      <div ref={listRef} style={{ border: '1px solid #444', padding: 12, borderRadius: 8, height: 300, overflowY: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.user}</strong>: {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}

