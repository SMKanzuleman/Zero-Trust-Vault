      import React, { useState } from 'react';
      import { Link, useNavigate } from 'react-router-dom';
      import axios from 'axios';
      import { ArrowLeft, KeyRound, User, Mail } from 'lucide-react';
      import toast from 'react-hot-toast';

      const Signup = () => {
        const [username, setUsername] = useState('');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [confirmPassword, setConfirmPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const navigate = useNavigate();

        const handleSignup = async (e) => {
          e.preventDefault();
          setLoading(true);

          if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
          }

          try {
            await axios.post('http://localhost:5000/api/auth/signup', { username, email, password });
            toast.success('Account created successfully!');
            navigate('/login');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create account');
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
                <h1 className="text-3xl font-bold tracking-tight mb-2">Create Account</h1>
                <p className="text-muted">Set up your secure vault identity.</p>
              </div>

              <form onSubmit={handleSignup} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text">Username</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-border rounded-[6px] py-2.5 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text transition-all bg-surface"
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text">Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-border rounded-[6px] py-2.5 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text transition-all bg-surface"
                      placeholder="Enter your email address"
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
                      placeholder="Create a strong password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text">Confirm Password</label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-border rounded-[6px] py-2.5 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text transition-all bg-surface"
                      placeholder="Confirm your password"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-2 w-full bg-text text-white font-semibold py-3 rounded-[6px] hover:bg-text/90 transition-colors disabled:opacity-70 shadow-sm"
                >
                  {loading ? 'Creating Identity...' : 'Sign Up'}
                </button>
              </form>

              <div className="mt-8 text-center text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-text font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        );
      };

      export default Signup;
