import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
          Page not found
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 transition-colors"
          >
            <Home size={20} />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
