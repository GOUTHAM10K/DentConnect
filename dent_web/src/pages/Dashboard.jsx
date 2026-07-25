import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/dentconnectService';
import { 
  Bell, 
  Plus, 
  FileText, 
  ClipboardCheck, 
  ArrowRight, 
  FolderOpen, 
  Activity, 
  Users, 
  MessageSquare,
  Globe
} from 'lucide-react';

export default function Dashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ cases: 0, shared: 0, followers: 42, connections: 28 });
  const [recentCases, setRecentCases] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userProfile?.uid) return;

      try {
        const summary = await getDashboardSummary(userProfile.uid);

        setStats({
          cases: summary.cases,
          shared: summary.shared,
          followers: userProfile.followersCount || 48,
          connections: userProfile.connectionsCount || 35
        });

        setRecentCases(summary.recentCases);

        // 4. Generate Mock Recent Activities matching screens
        setRecentActivities([
          { id: 1, type: 'post', desc: 'Published Case Study on RCT Treatment', time: '2 hours ago', icon: Globe },
          { id: 2, type: 'like', desc: 'Dr. Sarah liked your pre-op annotations', time: '5 hours ago', icon: Users },
          { id: 3, type: 'comment', desc: 'Dr. John commented: "Excellent canal obturation"', time: '1 day ago', icon: MessageSquare }
        ]);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userProfile]);

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Top Welcome / Profile Header */}
      <div className="glass-card p-6 md:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <img 
              src={userProfile?.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
              alt="Dr. Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md shadow-primary/10"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
              Welcome back, <span className="gradient-text">Dr. {userProfile?.name ? userProfile.name.replace(/^(dr\.\s*|dr\s+)+/i, '').split(' ')[0] : 'Clinician'}</span> 👋
            </h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              {userProfile?.specialization || 'General Dentistry'} • {userProfile?.institution || 'Dental Center'}
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto relative z-10">
          <Link 
            to="/cases/new" 
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5 transition-all duration-300"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Case</span>
          </Link>
          <Link 
            to="/notifications" 
            className="p-3 bg-slate-100/80 border border-slate-200/80 hover:bg-slate-200/80 rounded-xl transition-all relative text-slate-700"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
          </Link>
        </div>
      </div>

      {/* Grid: Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Total Cases */}
        <div className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Total Cases</span>
            <span className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl"><FolderOpen size={18} /></span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-heading">{stats.cases}</span>
            <span className="text-slate-400 text-xs font-semibold">files</span>
          </div>
        </div>

        {/* Shared Cases */}
        <div className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Shared Cases</span>
            <span className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl"><Globe size={18} /></span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 font-heading">{stats.shared}</span>
            <span className="text-slate-400 text-xs font-semibold">published</span>
          </div>
        </div>

        {/* Followers */}
        <div className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Followers</span>
            <span className="p-3 bg-sky-500/10 text-sky-600 rounded-2xl"><Users size={18} /></span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-600 font-heading">{stats.followers}</span>
            <span className="text-slate-400 text-xs font-semibold">peers</span>
          </div>
        </div>

        {/* Connections */}
        <div className="glass-card p-6 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300">
          <div className="flex justify-between items-start">
            <span className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Connections</span>
            <span className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl"><Users size={18} /></span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-heading">{stats.connections}</span>
            <span className="text-slate-400 text-xs font-semibold">doctors</span>
          </div>
        </div>

      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-heading">Quick Clinical Workflows</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Link 
            to="/cases/new" 
            className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
              <Plus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <span className="block font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">New Patient Case</span>
              <span className="block text-xs text-slate-500 font-medium">Record & annotate photos</span>
            </div>
          </Link>

          <Link 
            to="/cases" 
            className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="p-3 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
              <FileText size={20} />
            </div>
            <div>
              <span className="block font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">Saved Drafts</span>
              <span className="block text-xs text-slate-500 font-medium">Edit incomplete files</span>
            </div>
          </Link>

          <Link 
            to="/network" 
            className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="p-3 bg-gradient-to-br from-sky-400 to-blue-600 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
              <Globe size={20} />
            </div>
            <div>
              <span className="block font-bold text-sm text-slate-900 group-hover:text-sky-600 transition-colors">Community Feed</span>
              <span className="block text-xs text-slate-500 font-medium">Peer case discussions</span>
            </div>
          </Link>

          <Link 
            to="/support" 
            className="glass-card p-5 flex items-center gap-4 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="p-3 bg-gradient-to-br from-emerald-400 to-teal-600 text-white rounded-2xl shadow-md group-hover:scale-105 transition-transform">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <span className="block font-bold text-sm text-slate-900 group-hover:text-emerald-600 transition-colors">Digital Consents</span>
              <span className="block text-xs text-slate-500 font-medium">Verification templates</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Recent Cases & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {/* Recent Cases Section */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-heading">Recent Patient Cases</h3>
            <Link to="/cases" className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
              <span>View Directory</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-16 glass-card">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : recentCases.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 glass-card text-center space-y-3">
              <div className="p-4 bg-indigo-50 text-indigo-500 rounded-full"><FolderOpen size={36} /></div>
              <p className="text-sm font-bold text-slate-700">No active cases found in directory</p>
              <Link to="/cases/new" className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all">
                Create First Patient Case
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentCases.map((c) => (
                <Link 
                  key={c.id} 
                  to={`/cases/${c.id}`}
                  className="glass-card p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-11 h-11 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-primary rounded-2xl font-extrabold text-base border border-indigo-500/10">
                          {c.patientId?.charAt(0) || 'P'}
                        </div>
                        <div>
                          <span className="block font-bold text-sm text-slate-900 group-hover:text-primary transition-colors">
                            Ref: {c.patientId}
                          </span>
                          <span className="block text-xs text-slate-400 font-semibold">
                            {c.ageGender || `${c.age} Yrs / ${c.gender}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                        {formatDate(c.timestamp)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase">Diagnosis</span>
                      <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">{c.diagnosis || 'General Dentistry'}</span>
                    </div>
                  </div>

                  {c.imageUrls && c.imageUrls.length > 0 && (
                    <div className="mt-4 rounded-xl overflow-hidden aspect-video border border-slate-100 max-h-36">
                      <img src={c.imageUrls[0]} alt="Case visual" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activities Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight font-heading">Live Feed</h3>
          </div>

          <div className="glass-card p-5 space-y-4">
            {recentActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div key={act.id} className="flex gap-3.5 p-3 rounded-xl hover:bg-slate-100/60 transition-colors">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center"><Icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 leading-normal font-semibold">{act.desc}</p>
                    <span className="block text-[10px] text-slate-400 mt-1 font-bold">{act.time}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
