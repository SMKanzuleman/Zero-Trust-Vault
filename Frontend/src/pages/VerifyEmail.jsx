import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, KeyRound, Mail, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [email, setEmail] = useState('');
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  // Decode basic user info from JWT to show their email or check verified state
  useEffect(() => {
    if (!token) {
      toast.error('Session not found. Please log in.');
      navigate('/login');
      return;
    }

    // Fetch profile to verify if they are already verified and get their email
    const checkVerificationStatus = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = res.data.user;
        setEmail(user.email);
        if (user.isEmailVerified) {
          toast.success('Your email is already verified!');
          navigate('/vault');
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      }
    };

    checkVerificationStatus();
  }, [token, navigate]);

  // Cooldown timer logic for code resending
  useEffect(() => {
    if (cooldown === 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        'http://localhost:5000/api/auth/verify-email',
        { code: code.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update token in localStorage with the verified JWT returned from server
      localStorage.setItem('token', res.data.token);
      
      setVerified(true);
      toast.success('Email verified successfully!');
      
      setTimeout(() => {
        navigate('/vault');
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    try {
      await axios.post(
        'http://localhost:5000/api/auth/send-verification',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('New verification code sent!');
      setCooldown(30); // 30 seconds cooldown
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-[400px] text-center flex flex-col items-center gap-4 animate-[scaleUp_0.3s_ease-out]">
          <CheckCircle2 size={64} className="text-emerald-500 animate-bounce" />
          <h1 className="text-3xl font-bold tracking-tight">Identity Activated</h1>
          <p className="text-muted">Redirecting you to your secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => navigate('/vault')} 
        className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-2 text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="font-semibold text-sm">Skip for now</span>
      </button>

      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mb-4 text-accent">
            <Mail size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Verify Your Email</h1>
          <p className="text-muted text-sm px-4">
            We sent a 6-digit confirmation code to:
            <br />
            <span className="font-semibold text-text">{email || 'your email address'}</span>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-[10px] p-6 shadow-sm">
          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted text-center">
                Enter Verification Code
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-border rounded-[6px] py-3 pl-10 pr-3 focus:outline-none focus:border-text focus:ring-1 focus:ring-text text-center font-mono text-xl tracking-[0.5em] font-semibold bg-surface"
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-text text-white font-semibold py-3 rounded-[6px] hover:bg-text/90 transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Verifying...' : 'Verify & Activate'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs">
            <span className="text-muted">Didn't receive the code?</span>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="flex items-center gap-1.5 font-semibold text-accent hover:text-accent/80 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/vault')}
            className="text-sm font-semibold text-muted hover:text-text transition-colors underline"
          >
            Go to Dashboard (Skip)
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
