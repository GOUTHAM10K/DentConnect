import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth, db } from '../firebase';
import { updatePassword, deleteUser, signOut } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { 
  User, 
  Lock, 
  ShieldAlert, 
  Eye, 
  Smartphone, 
  Mail,
  Globe, 
  Moon, 
  Volume2,
  Trash2,
  CheckCircle
} from 'lucide-react';

export default function Settings() {
  const { userProfile, updateProfileData } = useAuth();
  const navigate = useNavigate();
  
  // TABS: 'account', 'privacy', 'password', 'danger'
  const [activeSubTab, setActiveSubTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Account Settings States
  const [accountForm, setAccountForm] = useState({
    name: '',
    phone: '',
    specialization: 'General Dentistry',
    institution: '',
    location: '',
    photoUrl: ''
  });

  // 2. Privacy Settings States
  const [privacyForm, setPrivacyForm] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showCasesToPublic: true
  });

  // 3. Password States
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // 4. Interface states (Dark mode, Language)
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (userProfile) {
      setAccountForm({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
        specialization: userProfile.specialization || 'General Dentistry',
        institution: userProfile.institution || '',
        location: userProfile.location || '',
        photoUrl: userProfile.photoUrl || ''
      });

      if (userProfile.privacySettings) {
        setPrivacyForm(userProfile.privacySettings);
      }
    }

    // Load dark mode from HTML element class
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, [userProfile]);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateProfileData(accountForm);
      setSuccessMsg('Account profile details updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update account.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await updateProfileData({
        privacySettings: privacyForm
      });
      setSuccessMsg('Privacy preferences saved successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save privacy settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, passwordForm.newPassword);
        setSuccessMsg('Password updated successfully!');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setErrorMsg(err.message || 'Password update failed. Re-authenticate and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const doubleConfirm = window.confirm('DANGER! Delete your DentConnect profile permanently? This will remove all your patient cases, drafts, posts, and credentials. This cannot be undone.');
    if (!doubleConfirm) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const user = auth.currentUser;
      if (user) {
        // Remove Firestore profile doc
        await deleteDoc(doc(db, 'users', user.uid));
        // Delete user
        await deleteUser(user);
        navigate('/welcome');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete account. Please re-authenticate first.');
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => {
    const updated = !darkMode;
    setDarkMode(updated);
    if (updated) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Upload base64 profile image simulation
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAccountForm(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Settings Navigation Panels */}
      <div className="flex bg-white p-4 rounded-2xl border border-slate-100 shadow-soft flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Account Settings</h2>
          <p className="text-xs text-slate-400 font-medium">Control details, privacy, security and preferences</p>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200/50 flex-wrap gap-1 w-full md:w-auto">
          {['account', 'privacy', 'password', 'danger'].map((t) => (
            <button
              key={t}
              onClick={() => { setActiveSubTab(t); setSuccessMsg(''); setErrorMsg(''); }}
              className={`flex-1 md:flex-initial px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                activeSubTab === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'danger' ? 'Delete Account' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Action alerts banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUB-TABS VIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Active Panel Form */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          
          {/* VIEW 1: Account Settings / Edit Profile (Screen 52, 58) */}
          {activeSubTab === 'account' && (
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-4 mb-4">
                <img 
                  src={accountForm.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
                  alt="avatar" 
                  className="w-16 h-16 rounded-full object-cover border border-slate-100 shadow-sm"
                />
                
                <div className="relative">
                  <input 
                    type="file" 
                    onChange={handleAvatarUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-28"
                  />
                  <button 
                    type="button"
                    className="py-1.5 px-3 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors shadow-sm"
                  >
                    Change photo
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Full Name</label>
                  <input 
                    type="text" 
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Contact Phone</label>
                  <input 
                    type="text" 
                    value={accountForm.phone}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Specialization</label>
                  <select 
                    value={accountForm.specialization}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, specialization: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  >
                    <option value="General Dentistry">General Dentistry</option>
                    <option value="Orthodontics">Orthodontics</option>
                    <option value="Endodontics">Endodontics</option>
                    <option value="Periodontics">Periodontics</option>
                    <option value="Oral Surgery">Oral Surgery</option>
                    <option value="Prosthodontics">Prosthodontics</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Hospital Affiliation</label>
                  <input 
                    type="text" 
                    value={accountForm.institution}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, institution: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Practice Location</label>
                  <input 
                    type="text" 
                    value={accountForm.location}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, location: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all duration-200"
              >
                {loading ? 'Saving...' : 'Save Profile Details'}
              </button>
            </form>
          )}

          {/* VIEW 2: Privacy Settings (Screen 57) */}
          {activeSubTab === 'privacy' && (
            <form onSubmit={handlePrivacySubmit} className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2 mb-4">Privacy Permissions</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Public profile search visibility</span>
                      <span className="block text-[10px] text-slate-400">Allow other dentists and peer specialists to find your profile</span>
                    </div>
                    <select 
                      value={privacyForm.profileVisibility}
                      onChange={(e) => setPrivacyForm(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      className="py-1.5 px-3 border border-slate-200 bg-white rounded-lg text-xs"
                    >
                      <option value="public">Public</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Display email address publicly</span>
                      <span className="block text-[10px] text-slate-400">Display email contacts in profile sheet credentials</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacyForm.showEmail}
                      onChange={(e) => setPrivacyForm(prev => ({ ...prev, showEmail: e.target.checked }))}
                      className="w-4 h-4 text-primary focus:ring-primary bg-white border-slate-200 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-slate-800">Display case reports in searches</span>
                      <span className="block text-[10px] text-slate-400">Allow case search entries to list your case studies</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={privacyForm.showCasesToPublic}
                      onChange={(e) => setPrivacyForm(prev => ({ ...prev, showCasesToPublic: e.target.checked }))}
                      className="w-4 h-4 text-primary focus:ring-primary bg-white border-slate-200 rounded"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all duration-200"
              >
                {loading ? 'Saving...' : 'Save Privacy Preferences'}
              </button>
            </form>
          )}

          {/* VIEW 3: Change Password (Screen 59) */}
          {activeSubTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Old Password</label>
                <input 
                  type="password" 
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                  className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all duration-200"
              >
                {loading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* VIEW 4: Danger Zone / Delete Account (Screen 60) */}
          {activeSubTab === 'danger' && (
            <div className="space-y-5">
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3">
                <ShieldAlert size={24} className="text-red-500 shrink-0" />
                <div>
                  <span className="block font-bold text-xs text-red-600 uppercase">Critical danger zone actions</span>
                  <span className="block text-[10px] text-red-500/80 leading-normal mt-0.5 font-medium">Deactivating or deleting this profile will wipe out all clinical cases, files, images annotations, signature details, and contacts.</span>
                </div>
              </div>

              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/10 flex justify-center items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete Account File Permanently</span>
              </button>
            </div>
          )}

        </div>

        {/* Right Side: Interface Preferences panel */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-5 h-fit">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-0.5 border-b border-slate-50 pb-2">Interface Preferences</h3>
          
          <div className="space-y-4">
            {/* Dark Mode toggle */}
            <div className="flex items-center justify-between pl-0.5">
              <div className="flex gap-2.5 items-center">
                <Moon size={16} className="text-slate-400" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Dark Mode</span>
                  <span className="block text-[9px] text-slate-400 font-semibold">Enable dark theme styling</span>
                </div>
              </div>
              <button 
                onClick={toggleDarkMode}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative flex items-center ${
                  darkMode ? 'bg-primary' : 'bg-slate-200'
                }`}
              >
                <span className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-4' : 'translate-x-0'
                }`}></span>
              </button>
            </div>

            {/* Language dropdown */}
            <div className="flex items-center justify-between pl-0.5 pt-3 border-t border-slate-50">
              <div className="flex gap-2.5 items-center">
                <Globe size={16} className="text-slate-400" />
                <div>
                  <span className="block text-xs font-bold text-slate-800">Language</span>
                  <span className="block text-[9px] text-slate-400 font-semibold">Choose interface language</span>
                </div>
              </div>
              
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="py-1 px-2 border border-slate-200 bg-white rounded-lg text-xs"
              >
                <option value="en">English (US)</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="fr">Français</option>
              </select>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
