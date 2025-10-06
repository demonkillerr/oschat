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

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('oschat.user') : null;
    if (saved) setUser(saved);
  }, []);

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    socket.emit(socketEvents.ChatSend, { user, text: trimmed });
    setText('');
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') send();
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('oschat.user', user);
    }
  }, [user]);

  const canSend = text.trim().length > 0;

  return (
    <div className="chat-container">
      <div className="chat-toolbar">
        <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="name" style={{ flex: '0 0 160px' }} />
        <input value={text} onKeyDown={onKey} onChange={(e) => setText(e.target.value)} placeholder="type a message" style={{ flex: 1 }} />
        <button onClick={send} disabled={!canSend}>Send</button>
      </div>
      <div ref={listRef} className="chat-list">
        {messages.map((m) => {
          const me = m.user === user;
          const time = new Date(m.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          return (
            <div key={m.id} className={`chat-row ${me ? 'me' : ''}`}>
              <div className={`bubble ${me ? 'me' : 'other'}`}>
                <span className="meta">{m.user} • {time}</span>
                <span>{m.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

