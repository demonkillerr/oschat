"use client";
import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { socketEvents } from '@oschat/shared';

export default function HelloSocket() {
  const [message, setMessage] = useState<string>('Connecting...');

  useEffect(() => {
    const s = getSocket();
    const onHello = (payload: { message: string }) => setMessage(payload.message);
    s.on(socketEvents.Hello, onHello);
    return () => {
      s.off(socketEvents.Hello, onHello);
    };
  }, []);

  return (
    <div>
      <strong>Socket:</strong> {message}
    </div>
  );
}

