"use client";
import { useEffect, useState } from 'react';
import { getSocket } from '../lib/socket';
import { socketEvents } from '@oschat/shared';

export default function HelloSocket() {
  const [message, setMessage] = useState<string>('Connecting...');

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setMessage('Connected');
    const onConnectError = (err: unknown) => setMessage(`Connect error: ${String((err as any)?.message || err)}`);
    const onHello = (payload: { message: string }) => setMessage(payload.message);
    s.on('connect', onConnect);
    s.on('connect_error', onConnectError);
    s.on(socketEvents.Hello, onHello);
    return () => {
      s.off('connect', onConnect);
      s.off('connect_error', onConnectError);
      s.off(socketEvents.Hello, onHello);
    };
  }, []);

  return (
    <div>
      <strong>Socket:</strong> {message}
    </div>
  );
}

