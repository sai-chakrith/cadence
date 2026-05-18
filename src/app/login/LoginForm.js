"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginForm({ callbackUrl }) {
  const [email, setEmail] = useState("employee@goalpulse.com");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const nextUrl = res?.url || callbackUrl;
    if (nextUrl.startsWith("/")) {
      window.location.assign(nextUrl);
    } else {
      window.location.assign(callbackUrl);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-600">Use a demo account to continue.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="employee@goalpulse.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="demo123"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p className="font-medium text-gray-900">Demo credentials</p>
          <ul className="mt-2 space-y-1">
            <li>
              <span className="font-mono">employee@goalpulse.com</span> / <span className="font-mono">demo123</span>
            </li>
            <li>
              <span className="font-mono">manager@goalpulse.com</span> / <span className="font-mono">demo123</span>
            </li>
            <li>
              <span className="font-mono">admin@goalpulse.com</span> / <span className="font-mono">demo123</span>
            </li>
          </ul>
        </div>

        <div className="mt-6 text-center text-sm">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
