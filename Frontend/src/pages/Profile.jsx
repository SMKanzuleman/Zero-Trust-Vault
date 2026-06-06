import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const [username, setUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsername(res.data.user.username);
        setProfilePicture(res.data.user.profilePicture || '');
      } catch (err) {
        toast.error('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (e.g., max 500KB)
    if (file.size > 500 * 1024) {
      toast.error('Profile picture must be under 500KB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePicture = () => {
    setProfilePicture('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await axios.put('http://localhost:5000/api/auth/profile', 
        { username, profilePicture },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
      }

      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
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
          <h1 className="text-3xl font-bold tracking-tight mb-2">Edit Profile</h1>
          <p className="text-muted">Update your username and profile picture.</p>
        </div>

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-accent-light border-2 border-border flex items-center justify-center text-accent text-3xl font-bold">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    username?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div 
                  className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={24} className="text-white" />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-semibold text-text hover:text-accent transition-colors"
                >
                  Upload Picture
                </button>
                {profilePicture && (
                  <>
                    <span className="w-px h-4 bg-border"></span>
                    <button 
                      type="button"
                      onClick={handleRemovePicture}
                      className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                    >
                      <X size={14} /> Remove
                    </button>
                  </>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
              />
              <p className="text-xs text-muted text-center -mt-1">Max size: 500KB (JPEG, PNG, WEBP)</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-[6px] text-text focus:outline-none focus:border-text transition-colors shadow-sm"
                  placeholder="Your username"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full mt-2 bg-text text-white py-2.5 rounded-[6px] font-semibold hover:bg-text/90 transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Profile;
