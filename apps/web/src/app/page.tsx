import dynamic from 'next/dynamic';
const Hello = dynamic(() => import('../components/HelloSocket'), { ssr: false });
const Chat = dynamic(() => import('../components/Chat'), { ssr: false });
export default function HomePage() {
  return (
    <main style={{padding: 24}}>
      <h1>oschat</h1>
      <p>Next.js frontend scaffold is ready.</p>
      <hr />
      <h2>Connectivity</h2>
      <p>Backend socket hello event:</p>
      <Hello />
      <hr />
      <h2>Chat</h2>
      <Chat />
    </main>
  );
}

