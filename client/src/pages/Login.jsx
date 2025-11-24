import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wifi } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      // Navigate based on role, but for now just go to dashboard (which we will route)
      // We'll handle redirection in the component or main app
      const user = JSON.parse(localStorage.getItem('user'));
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-full">
            <Wifi className="text-white w-8 h-8" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Smart Campus Wi-Fi</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email Address
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              id="email"
              type="email"
              placeholder="student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              id="password"
              type="password"
              placeholder="******************"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition duration-200"
              type="submit"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Demo Accounts:</p>
          <p>Student: student@campus.edu / student123</p>
          <p>Admin: admin@campus.edu / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
