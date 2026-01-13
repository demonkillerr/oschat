import Link from 'next/link';
import { MessageSquare, Shield, Zap, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">OSChat</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                className="btn-primary"
              >
                Sign in with Google
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Real-time chat for everyone
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Connect with friends and colleagues instantly. Create group conversations,
                send direct messages, and stay in sync across all your devices.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
                  className="btn-primary text-base px-6 py-3"
                >
                  Get started
                </Link>
                <Link href="#features" className="text-sm font-semibold leading-6 text-gray-900">
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-primary-600">
                Features
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Everything you need to stay connected
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    Real-time messaging
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Messages are delivered instantly using WebSocket technology.
                    No refresh needed.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    Group conversations
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Create groups with multiple members. Add or remove members as needed.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    Secure authentication
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Sign in securely with your Google account. Your data is protected.
                  </dd>
                </div>
                <div className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                      <MessageSquare className="h-6 w-6 text-white" />
                    </div>
                    Offline sync
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    Never miss a message. Catch up on everything when you reconnect.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <p className="text-center text-xs leading-5 text-gray-500">
            &copy; {new Date().getFullYear()} OSChat. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
