import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      // Save token
      localStorage.setItem('token', response.data.token);
      toast.success('Logged in successfully!');
      
      // Redirect based on user role
      const userRole = response.data.user?.role || 'user';
      if (userRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/vault');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-muted hover:text-text transition-colors">
        <ArrowLeft size={20} />
        <span className="font-semibold text-sm">Back to Home</span>
      </Link>
      
      <div className="w-full max-w-[400px]">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
          <p className="text-muted">Enter your credentials to access the vault.</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Email Address</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-border rounded-[6px] py-2.5 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text transition-all bg-surface"
                placeholder="Enter email address"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text">Password</label>
            <div className="relative">
              <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-border rounded-[6px] py-2.5 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text transition-all bg-surface"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="mt-2 w-full bg-accent text-white font-semibold py-3 rounded-[6px] hover:bg-accent/90 transition-colors disabled:opacity-70 shadow-sm cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/signup" className="text-text font-semibold hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
