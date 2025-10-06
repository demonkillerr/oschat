export const socketEvents = {
  Hello: 'hello',
  ChatSend: 'chat:send',
  ChatNew: 'chat:new',
};

export const appConstants = {
  AppName: 'oschat'
};

// Simple message contract shared between client and server
export function createMessage({ user, text }) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    user,
    text,
    ts: Date.now()
  };
}

