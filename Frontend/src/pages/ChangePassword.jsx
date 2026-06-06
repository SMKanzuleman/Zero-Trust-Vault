import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { KeyRound, ArrowLeft, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      setSaving(false);
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/auth/password', 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-8 flex items-center justify-center relative">
      <Link 
        to="/dashboard" 
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-semibold text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={16} /> Back to Vault
      </Link>

      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Change Password</h1>
          <p className="text-muted">Ensure your vault stays completely secure.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Current Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <KeyRound size={18} />
              </div>
              <input 
                type="password" 
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:border-text transition-colors shadow-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                minLength="8"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:border-text transition-colors shadow-sm"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-text mb-1.5">Confirm New Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                minLength="8"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:border-text transition-colors shadow-sm"
                placeholder="Min 8 characters"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full mt-4 bg-text text-white py-2.5 rounded-[6px] font-semibold hover:bg-text/90 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
