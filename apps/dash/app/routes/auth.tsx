export function meta() {
  return [
    { title: "Sign In — Quest" },
    { name: "description", content: "Sign in to Quest Dashboard" },
  ];
}

export async function action() {
  // uhh add auth logic
  return null;
}

export default function Auth() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div>
        <h1 className="text-2xl font-bold text-black mb-8 text-center">Quest Dashboard</h1>

        <form method="post">
          <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 active:bg-indigo-700">
            <DiscordIcon />
            Sign in with Discord
          </button>
        </form>

        <p className="mt-2 text-sm text-gray-500 text-center">Sign in to continue</p>
      </div>
      <p className="fixed bottom-3 left-0 right-0 text-center text-gray-400 font-['Inter'] text-sm font-light leading-normal">
        Powered by <a href="https://duckorg.com/" target="_blank" rel="noreferrer" className="underline hover:text-gray-600">Duck Organization</a>
      </p>
    </main>
  );
}

function DiscordIcon() {
  return (
    <svg width="48" height="40" viewBox="0 0 640 512" fill="white">
      <path d="m386 137c-24-11-49.5-19-76.3-23.7c-.5 0-1 0-1.2.6c-3.3 5.9-7 13.5-9.5 19.5c-29-4.3-57.5-4.3-85.7 0c-2.6-6.2-6.3-13.7-10-19.5c-.3-.4-.7-.7-1.2-.6c-23 4.6-52.4 13-76 23.7c-.2 0-.4.2-.5.4c-49 73-62 143-55 213c0 .3.2.7.5 1c32 23.6 63 38 93.6 47.3c.5 0 1 0 1.3-.4c7.2-9.8 13.6-20.2 19.2-31.2c.3-.6 0-1.4-.7-1.6c-10-4-20-8.6-29.3-14c-.7-.4-.8-1.5 0-2c2-1.5 4-3 5.8-4.5c.3-.3.8-.3 1.2-.2c61.4 28 128 28 188 0c.4-.2.9-.1 1.2.1c1.9 1.6 3.8 3.1 5.8 4.6c.7.5.6 1.6 0 2c-9.3 5.5-19 10-29.3 14c-.7.3-1 1-.6 1.7c5.6 11 12.1 21.3 19 31c.3.4.8.6 1.3.4c30.6-9.5 61.7-23.8 93.8-47.3c.3-.2.5-.5.5-1c7.8-80.9-13.1-151-55.4-213c0-.2-.3-.4-.5-.4Zm-192 171c-19 0-34-17-34-38c0-21 15-38 34-38c19 0 34 17 34 38c0 21-15 38-34 38zm125 0c-19 0-34-17-34-38c0-21 15-38 34-38c19 0 34 17 34 38c0 21-15 38-34 38z" />
    </svg>
  );
}
