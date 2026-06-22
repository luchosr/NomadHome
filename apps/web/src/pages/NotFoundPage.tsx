import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-2xl font-bold text-slate-800">404 — Page not found</h1>
      <Link to="/" className="text-sm text-slate-500 hover:underline">
        Go home
      </Link>
    </div>
  );
}
