'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push('/games');
    router.refresh();
  };

  return (
    <main className="mx-auto min-h-[100dvh] max-w-lg px-4 pb-8 pt-safe">
      <header className="py-8 text-center">
        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-gray-500">Email and password — no 2FA</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-base text-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">At least 8 characters</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="min-h-[52px] w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-800">
          Sign in
        </Link>
      </p>
    </main>
  );
}
