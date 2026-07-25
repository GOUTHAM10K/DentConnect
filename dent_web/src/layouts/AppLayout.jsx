import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Compass, 
  MessageSquare, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut, 
  Bell, 
  Search, 
  Plus, 
  Menu, 
  X 
} from 'lucide-react';

export default function AppLayout() {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Cases', path: '/cases', icon: FolderOpen },
    { name: 'Community Feed', path: '/network', icon: Compass },
    { name: 'Messaging', path: '/chat', icon: MessageSquare },
    { name: 'My Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help & Support', path: '/support', icon: HelpCircle },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/welcome');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const currentActiveName = menuItems.find(item => {
    if (item.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(item.path);
  })?.name || 'DentConnect';

  return (
    <div className="flex min-h-screen bg-slate-50/60 font-sans text-slate-900">
      {/* 1. Left Sidebar - Desktop Only */}
      <aside className="hidden md:flex flex-col w-64 bg-white/90 backdrop-blur-xl border-r border-slate-200/80 p-6 shrink-0 shadow-xl justify-between z-30">
        <div className="flex flex-col gap-8">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-primary to-purple-600 text-white font-extrabold text-2xl shadow-lg shadow-primary/30">
              D
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 font-heading">DentConnect</span>
              <span className="block text-[10px] uppercase tracking-widest text-primary font-extrabold">Clinical Platform</span>
            </div>
          </div>

          {/* New Case Button */}
          <Link 
            to="/cases/new" 
            className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-gradient-to-r from-indigo-600 via-primary to-purple-600 text-white font-bold text-sm rounded-2xl hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>New Patient Case</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.path === '/' 
                ? location.pathname === '/' 
                : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-primary/15 to-purple-500/10 text-primary font-bold shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                  }`}
                >
                  <Icon size={19} className={isActive ? 'text-primary' : 'text-slate-400'} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Profile Card / Logout */}
        <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-3">
            <img 
              src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
              alt="Profile" 
              className="w-10 h-10 rounded-xl object-cover border-2 border-primary/20 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-sm text-slate-800 truncate">
                Dr. {userProfile?.name?.split(' ')[0] || 'Dentist'}
              </span>
              <span className="block text-[11px] text-slate-400 font-semibold truncate">
                {userProfile?.specialization || 'General Dentistry'}
              </span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-bold text-sm text-rose-500 hover:bg-rose-50 transition-all duration-200"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Layout Area */}
      <div className="flex flex-col flex-1 min-w-0 pb-16 md:pb-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger Toggle */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="font-extrabold text-base md:text-xl text-slate-800 tracking-tight">
              {currentActiveName}
            </h1>
          </div>

          {/* Search Bar - Desktop & Large Screens */}
          <form 
            onSubmit={handleSearchSubmit} 
            className={`hidden md:flex items-center w-full max-w-sm px-3.5 py-1.5 bg-slate-50 border rounded-xl transition-all duration-200 ${
              searchFocused ? 'border-primary bg-white shadow-sm ring-2 ring-primary/10' : 'border-slate-200'
            }`}
          >
            <Search size={16} className={`mr-2.5 transition-colors ${searchFocused ? 'text-primary' : 'text-slate-400'}`} />
            <input 
              type="text" 
              placeholder="Search patients, specialists, cases..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full bg-transparent text-sm border-none p-0 outline-none text-slate-800 placeholder-slate-400"
            />
          </form>

          {/* Header Controls (Notification Bell & Profile Icon) */}
          <div className="flex items-center gap-2 md:gap-3">
            <Link 
              to="/search" 
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </Link>
            
            <Link 
              to="/notifications" 
              className="relative p-2.5 text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow shadow-red-500/50"></span>
            </Link>

            <div className="h-6 w-px bg-slate-100 hidden sm:block"></div>

            <Link 
              to="/profile" 
              className="flex items-center gap-2 pl-1 hover:opacity-85 transition-opacity"
            >
              <img 
                src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
                alt="Avatar" 
                className="w-8 h-8 rounded-lg object-cover border border-slate-100 shadow-sm"
              />
              <span className="hidden sm:block font-semibold text-xs text-slate-700">
                Dr. {userProfile?.name ? userProfile.name.replace(/^(dr\.\s*|dr\s+)+/i, '').split(' ')[0] : 'Dentist'}
              </span>
            </Link>
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileMenuOpen(false)}>
            <div 
              className="w-64 bg-white h-full flex flex-col p-6 animate-slide-right justify-between shadow-2xl" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col gap-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-extrabold text-base">
                      D
                    </div>
                    <span className="font-extrabold text-base tracking-tight text-slate-800">DentConnect</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-50 rounded-lg">
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex flex-col gap-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.path === '/' 
                      ? location.pathname === '/' 
                      : location.pathname.startsWith(item.path);

                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary/10 text-primary' 
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={18} className={isActive ? 'text-primary' : 'text-slate-400'} />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
                <button 
                  onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                  className="flex items-center gap-3 px-4 py-2 text-red-500 font-semibold text-sm hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full">
          <Outlet />
        </main>
      </div>

      {/* 4. Bottom Navigation - Mobile Only (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around px-2 z-40 shadow-lg shadow-slate-900/10">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            location.pathname === '/' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] font-semibold">Home</span>
        </Link>

        <Link 
          to="/cases" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            location.pathname.startsWith('/cases') && location.pathname !== '/cases/new' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <FolderOpen size={18} />
          <span className="text-[10px] font-semibold">Cases</span>
        </Link>

        {/* Center Add Button */}
        <Link 
          to="/cases/new" 
          className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full shadow-lg shadow-primary/30 hover:bg-primary-hover transform hover:-translate-y-1 active:translate-y-0 transition-all -mt-5 z-50 border-4 border-white"
          aria-label="New Case"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>

        <Link 
          to="/network" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            location.pathname.startsWith('/network') ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Compass size={18} />
          <span className="text-[10px] font-semibold">Feed</span>
        </Link>

        <Link 
          to="/profile" 
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            location.pathname.startsWith('/profile') ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={18} />
          <span className="text-[10px] font-semibold">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
