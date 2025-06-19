export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white-900 via-white-800 to-white-900 flex flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center space-y-8 max-w-md w-full">
        <div className="size-60 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 shadow-2xl">
          <img
            src="/graph.svg"
            alt="Argus Logo"
            className="size-44 object-contain"
          />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 tracking-wide">Argus</h1>
          <p className="text-secondary-foreground text-sm">Loading...</p>
        </div>
      </div>

      <div className="absolute bottom-8 text-center">
        <p className="text-secondary-foreground text-xs">
          © 2025 Argus - Version 0.1.0
        </p>
      </div>
    </div>
  );
}
