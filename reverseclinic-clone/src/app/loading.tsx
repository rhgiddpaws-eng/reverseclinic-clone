export default function Loading() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      <div className="h-1 bg-gradient-to-r from-pink-500 via-rose-400 to-pink-500 animate-loading-bar" />
      <style>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
