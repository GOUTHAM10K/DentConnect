import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserCases, getUserDrafts, deleteCaseDocument } from '../services/dentconnectService';
import { 
  FolderOpen, 
  Plus, 
  Calendar, 
  User, 
  Clipboard, 
  Trash2, 
  ArrowRight,
  CheckSquare,
  Square,
  Sparkles,
  Download,
  X,
  Layers,
  Check
} from 'lucide-react';

export default function Cases() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'drafts'
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const currentList = activeTab === 'cases' ? cases : drafts;

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      if (activeTab === 'cases') {
        const list = await getUserCases(userProfile.uid);
        setCases(list);
      } else {
        const list = await getUserDrafts(userProfile.uid);
        setDrafts(list);
      }
    } catch (err) {
      console.error('Error fetching cases/drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    setSelectedIds([]);
  }, [userProfile, activeTab]);

  const toggleSelectAll = () => {
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map(item => item.id));
    }
  };

  const toggleSelectItem = (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!window.confirm('Delete this item permanently? This cannot be undone.')) return;

    try {
      const collectionName = activeTab === 'cases' ? 'cases' : 'drafts';
      await deleteCaseDocument(userProfile.uid, collectionName, id);
      setSelectedIds(prev => prev.filter(itemId => itemId !== id));
      fetchData();
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Delete failed: ' + err.message);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected items permanently?`)) return;

    try {
      const collectionName = activeTab === 'cases' ? 'cases' : 'drafts';
      for (const id of selectedIds) {
        await deleteCaseDocument(userProfile.uid, collectionName, id);
      }
      setSelectedIds([]);
      fetchData();
    } catch (err) {
      console.error('Error batch deleting:', err);
      alert('Batch delete encountered an issue: ' + err.message);
    }
  };

  const handleExportSelected = () => {
    const selectedData = currentList.filter(item => selectedIds.includes(item.id));
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(selectedData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", jsonStr);
    downloadAnchor.setAttribute("download", `dentconnect_${activeTab}_export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const allSelected = currentList.length > 0 && selectedIds.length === currentList.length;

  return (
    <div className="space-y-6 animate-fade-in relative pb-16">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <FolderOpen size={22} className="icon-animated" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Cases Directory
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                {currentList.length} total
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">Create, select, and organize your clinical case records</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {currentList.length > 0 && (
            <button 
              onClick={toggleSelectAll}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all border ${
                allSelected 
                  ? 'bg-primary/10 text-primary border-primary/30' 
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {allSelected ? <CheckSquare size={16} className="text-primary icon-animated" /> : <Square size={16} className="text-slate-400 icon-animated" />}
              <span>{allSelected ? 'Deselect All' : 'Select All'}</span>
            </button>
          )}

          <Link 
            to="/cases/new" 
            className="shimmer-btn flex items-center gap-2 px-4 py-2.5 text-white font-bold text-xs rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.98] transition-all"
          >
            <Plus size={16} className="icon-animated" />
            <span>New Case</span>
          </Link>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-80">
        <button 
          onClick={() => setActiveTab('cases')}
          className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cases' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers size={14} className={activeTab === 'cases' ? 'text-primary' : ''} />
          Completed ({cases.length})
        </button>
        <button 
          onClick={() => setActiveTab('drafts')}
          className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'drafts' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles size={14} className={activeTab === 'drafts' ? 'text-amber-500' : ''} />
          Drafts ({drafts.length})
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-white border border-slate-200/80 shadow-sm rounded-3xl">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : activeTab === 'cases' ? (
        cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200/80 shadow-sm rounded-3xl text-center space-y-3">
            <div className="p-4 bg-primary/10 text-primary rounded-full animate-float">
              <FolderOpen size={36} />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base">No Completed Cases Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs font-semibold">Verify consent and finalize case templates in the wizard to record case sheets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cases.map((c) => {
              const isSelected = selectedIds.includes(c.id);
              return (
                <div 
                  key={c.id} 
                  onClick={() => navigate(`/cases/${c.id}`)}
                  className={`selection-card glass-card p-6 flex flex-col justify-between cursor-pointer group ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                          onClick={(e) => toggleSelectItem(c.id, e)}
                          className={`p-1 rounded-lg transition-all ${
                            isSelected ? 'bg-primary text-white scale-110 shadow-sm' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          aria-label="Select case"
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={16} />}
                        </button>
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                          Ref: {c.patientId}
                        </span>
                      </div>

                      <button 
                        onClick={(e) => handleDelete(c.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors shrink-0 icon-animated-trigger"
                        aria-label="Delete Case"
                      >
                        <Trash2 size={15} className="icon-animated" />
                      </button>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                        <User size={14} className="text-primary icon-animated" />
                        <span>{c.ageGender || `${c.age} Yrs / ${c.gender}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-800 font-bold bg-slate-100/80 p-2.5 rounded-2xl border border-slate-200/60">
                        <Clipboard size={14} className="text-primary shrink-0 icon-animated" />
                        <span className="truncate">{c.diagnosis || 'General Dentistry'}</span>
                      </div>
                    </div>

                    {c.imageUrls && c.imageUrls.length > 0 && (
                      <div className="rounded-2xl overflow-hidden aspect-video border border-slate-200/80 mb-4 max-h-36 shadow-sm">
                        <img src={c.imageUrls[0]} alt="Case photo" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(c.timestamp)}
                    </span>
                    <span className="flex items-center gap-1 text-primary group-hover:translate-x-1 transition-transform">
                      View Case <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 glass-card text-center space-y-3">
            <div className="p-4 bg-amber-50 text-amber-500 rounded-full animate-float">
              <FolderOpen size={36} />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base">No Saved Drafts</h3>
            <p className="text-xs text-slate-500 max-w-xs font-semibold">Start a wizard case flow and click 'Save Draft' at any step to record files here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {drafts.map((d) => {
              const isSelected = selectedIds.includes(d.id);
              return (
                <div 
                  key={d.id} 
                  onClick={() => navigate(`/cases/${d.id}/edit`)}
                  className={`selection-card glass-card p-6 flex flex-col justify-between cursor-pointer group ${isSelected ? 'selected' : ''}`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <button 
                          onClick={(e) => toggleSelectItem(d.id, e)}
                          className={`p-1 rounded-lg transition-all ${
                            isSelected ? 'bg-amber-500 text-white scale-110 shadow-sm' : 'text-slate-300 hover:text-slate-500'
                          }`}
                          aria-label="Select draft"
                        >
                          {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={16} />}
                        </button>
                        <span className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors truncate">
                          Ref: {d.patientId || 'Draft File'}
                        </span>
                      </div>

                      <button 
                        onClick={(e) => handleDelete(d.id, e)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors shrink-0 icon-animated-trigger"
                        aria-label="Delete Draft"
                      >
                        <Trash2 size={15} className="icon-animated" />
                      </button>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                        <User size={14} className="text-amber-500 icon-animated" />
                        <span>{d.ageGender || `${d.age || '?'} Yrs / ${d.gender || '?'}`}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-800 font-bold bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200/60">
                        <Clipboard size={14} className="text-amber-600 shrink-0 icon-animated" />
                        <span className="truncate">{d.complaint || 'Draft details in progress'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 text-[11px] text-slate-500 font-bold">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      {formatDate(d.timestamp)}
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 group-hover:translate-x-1 transition-transform">
                      Edit Draft <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Floating Animated Batch Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="floating-batch-bar px-6 py-3.5 flex items-center gap-4 text-white animate-slide-up">
          <div className="flex items-center gap-2 pr-4 border-r border-white/20">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-black shadow-md">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold tracking-wide">Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all border border-white/15"
            >
              <Download size={14} className="icon-animated" />
              <span>Export JSON</span>
            </button>

            <button 
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-semibold transition-all border border-rose-500/30"
            >
              <Trash2 size={14} className="icon-animated" />
              <span>Delete</span>
            </button>

            <button 
              onClick={() => setSelectedIds([])}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
              aria-label="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

