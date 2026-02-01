import React, { useState } from 'react';
import { Lock, User as UserIcon, Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
  appName: string;
  logoUrl: string;
  users: User[];
}

const Login: React.FC<LoginProps> = ({ onLogin, appName, logoUrl, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulated auth logic with dynamic user support
    setTimeout(() => {
      const foundUser = users.find(u => u.username === username.toLowerCase());
      
      // Check password: if explicit password exists use it, otherwise use username + '123'
      const correctPassword = foundUser?.password || (foundUser?.username + '123');
      
      if (foundUser && password === correctPassword) {
        onLogin(foundUser);
      } else {
        setError('Invalid credentials. Check username or contact Admin.');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#f0f2f5] p-4">
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="w-20 h-20 bg-black rounded-xl flex items-center justify-center shadow-xl overflow-hidden border-2 border-white">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-white">{appName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{appName}</h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Retail Management System</p>
        </div>
      </div>

      <div className="w-full max-w-[360px]">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 shadow-sm text-xs text-red-700 animate-in fade-in slide-in-from-top-2 flex items-center gap-2 font-medium">
            <ShieldCheck size={16} />
            {error}
          </div>
        )}

        <div className="bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.13)] border border-[#ccd0d4] rounded-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Username</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  required
                  placeholder="Your username"
                  className="w-full pl-10 pr-4 py-3 border border-[#ccd0d4] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-[#ccd0d4] rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 bg-[#2271b1] hover:bg-[#135e96] text-white font-bold rounded shadow-[0_1px_0_#135e96] flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-4 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Enter Dashboard
                  <LogIn size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
            <p className="text-xs text-gray-400 font-medium tracking-tight">System Default: password is username + '123'</p>
        </div>
      </div>
    </div>
  );
};

export default Login;