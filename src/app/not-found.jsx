import Link from 'next/link';

const NotFound = () => {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-carafe px-6 py-24 text-center text-sand">
      {/* Subtle Background Glow */}
      <div className="pointer-events-none absolute -top-40 -z-10 h-[32rem] w-[32rem] rounded-full bg-brown/20 blur-3xl" />

      {/* 404 Status Pill */}
      <div className="inline-flex items-center gap-2 rounded-full border border-brown/40 bg-brown/15 px-3.5 py-1 text-xs font-semibold tracking-wider text-tan uppercase">
        Error 404
      </div>

      {/* Main Heading */}
      <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
        Page Not Found
      </h1>

      {/* Subtext */}
      <p className="mt-4 max-w-md text-base leading-relaxed text-tan">
        Oops! The page you are looking for has either been moved, deleted, or never existed in the library.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="rounded-lg bg-brown px-5 py-2.5 text-sm font-semibold text-sand shadow-sm transition-all hover:bg-brown/80 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-tan"
        >
          Return Home
        </Link>
        <Link
          href="/games"
          className="rounded-lg border border-brown/40 bg-carafe/80 px-5 py-2.5 text-sm font-medium text-sand transition-all hover:bg-brown/20 hover:text-white"
        >
          Browse Games
        </Link>
      </div>
    </div>
  );
};

export default NotFound;