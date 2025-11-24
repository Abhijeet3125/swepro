import { useContext } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Wifi, LogOut, User } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-full mr-3">
                  <Wifi className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-xl text-gray-900">Smart Campus</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">{user?.username}</span>
                <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full uppercase tracking-wide text-gray-500 border border-gray-200">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            &copy; 2025 Smart Campus Wi-Fi Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
