import { Link, useLocation } from "react-router-dom";
import { Laptop2 } from "lucide-react";

export const Navbar = () => {
  const location = useLocation();
  const isRoomPage = location.pathname.startsWith("/room/");

  if (isRoomPage) return null;

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Laptop2 className="h-8 w-8 text-blue-500" />
              <span className="text-xl font-semibold text-gray-900">
                Interactive Tutoring
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
