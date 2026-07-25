import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, getDocs } from 'firebase/firestore';
import { Search, FolderOpen, User, Building, MapPin, ArrowLeft, Sparkles, Filter, CheckCircle2 } from 'lucide-react';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'cases', 'dentists'
  
  const [loading, setLoading] = useState(false);
  const [caseResults, setCaseResults] = useState([]);
  const [dentistResults, setDentistResults] = useState([]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    }
  };

  useEffect(() => {
    setSearchQuery(queryParam);
    if (!queryParam.trim()) {
      setCaseResults([]);
      setDentistResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        const queryLower = queryParam.toLowerCase();

        // 1. Search across dentists (users collection)
        const dentistsRef = collection(db, 'users');
        const dentistSnap = await getDocs(dentistsRef);
        const matchedDentists = [];
        dentistSnap.forEach((docSnap) => {
          const data = docSnap.data();
          const name = (data.name || '').toLowerCase();
          const specialization = (data.specialization || '').toLowerCase();
          const institution = (data.institution || '').toLowerCase();
          const location = (data.location || '').toLowerCase();

          if (name.includes(queryLower) || specialization.includes(queryLower) || institution.includes(queryLower) || location.includes(queryLower)) {
            matchedDentists.push({ id: docSnap.id, ...data });
          }
        });
        setDentistResults(matchedDentists);

        // 2. Search across cases
        const matchedCases = [];
        for (const docSnap of dentistSnap.docs) {
          const userCasesSnap = await getDocs(collection(db, 'users', docSnap.id, 'cases'));
          userCasesSnap.forEach((cDoc) => {
            const cData = cDoc.data();
            const patientId = (cData.patientId || '').toLowerCase();
            const diagnosis = (cData.diagnosis || '').toLowerCase();
            const complaint = (cData.complaint || '').toLowerCase();
            const treatment = (cData.treatment || '').toLowerCase();

            if (patientId.includes(queryLower) || diagnosis.includes(queryLower) || complaint.includes(queryLower) || treatment.includes(queryLower)) {
              matchedCases.push({ id: cDoc.id, clinicianName: docSnap.data().name, ...cData });
            }
          });
        }
        setCaseResults(matchedCases);

      } catch (e) {
        console.error('Error conducting search:', e);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [queryParam]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Search Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all text-slate-600 shrink-0 icon-animated-trigger"
        >
          <ArrowLeft size={18} className="icon-animated" />
        </button>

        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 focus-within:bg-white focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300">
          <Search size={20} className="text-primary mr-3 shrink-0 icon-animated" />
          <input 
            type="text" 
            placeholder="Type query (e.g. Endodontics, RCT, Dr. Priya, Implants)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-sm border-none p-0 outline-none text-slate-900 font-medium placeholder:text-slate-400"
          />
          <button type="submit" className="hidden">Submit</button>
        </form>
      </div>

      {/* Filter Tabs */}
      {queryParam.trim() && (
        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200/80 w-full sm:w-auto overflow-x-auto">
          <button 
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[100px] px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter size={14} className={activeTab === 'all' ? 'text-primary' : ''} />
            All ({caseResults.length + dentistResults.length})
          </button>
          <button 
            onClick={() => setActiveTab('cases')}
            className={`flex-1 min-w-[120px] px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'cases' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderOpen size={14} className={activeTab === 'cases' ? 'text-primary' : ''} />
            Cases ({caseResults.length})
          </button>
          <button 
            onClick={() => setActiveTab('dentists')}
            className={`flex-1 min-w-[120px] px-5 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
              activeTab === 'dentists' ? 'bg-white text-primary shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={14} className={activeTab === 'dentists' ? 'text-primary' : ''} />
            Clinicians ({dentistResults.length})
          </button>
        </div>
      )}

      {/* Search results listing */}
      {loading ? (
        <div className="flex items-center justify-center p-20">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : !queryParam.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-card p-8 rounded-3xl">
          <div className="p-4 bg-primary/10 text-primary rounded-full animate-float">
            <Search size={40} />
          </div>
          <h3 className="text-slate-900 font-extrabold text-lg">Search DentConnect Directory</h3>
          <p className="text-xs text-slate-500 max-w-sm font-semibold">Type clinical keywords, dentist names, hospital affiliations, or patient diagnoses in the box above.</p>
        </div>
      ) : (caseResults.length === 0 && dentistResults.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 glass-card p-8 rounded-3xl">
          <div className="p-4 bg-rose-50 text-rose-500 rounded-full animate-float">
            <Search size={40} />
          </div>
          <h3 className="text-slate-900 font-extrabold text-lg">No Results Found</h3>
          <p className="text-xs text-slate-500 max-w-xs font-semibold">We couldn't find any matches for "{queryParam}". Please double-check your spelling or filters.</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Cases Panel */}
          {(activeTab === 'all' || activeTab === 'cases') && caseResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <FolderOpen size={14} className="text-primary" />
                Clinical Cases ({caseResults.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {caseResults.map((c) => (
                  <Link 
                    key={c.id} 
                    to={`/cases/${c.id}`}
                    className="glass-card p-5 flex gap-4 cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="p-3 bg-primary/10 text-primary rounded-2xl h-12 w-12 flex items-center justify-center shrink-0 shadow-inner">
                      <FolderOpen size={22} className="icon-animated" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-extrabold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                        Patient Ref: {c.patientId}
                      </span>
                      <span className="block text-xs text-slate-600 font-semibold truncate mt-0.5">
                        {c.ageGender || `${c.age} Yrs / ${c.gender}`} • {c.diagnosis}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-bold mt-2">
                        Clinician: {c.clinicianName || 'Dr. Specialist'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Dentists Panel */}
          {(activeTab === 'all' || activeTab === 'dentists') && dentistResults.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <User size={14} className="text-primary" />
                Dental Professionals ({dentistResults.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dentistResults.map((d) => (
                  <Link 
                    key={d.id} 
                    to={`/profile/${d.id}`}
                    className="glass-card p-5 flex gap-4 cursor-pointer group hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="relative shrink-0">
                      <img 
                        src={d.photoUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150'} 
                        alt={d.name}
                        className="w-13 h-13 rounded-2xl object-cover border border-slate-200/80 shadow-sm"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="block font-extrabold text-sm text-slate-900 group-hover:text-primary transition-colors truncate">
                        Dr. {d.name ? d.name.replace(/^(dr\.\s*|dr\s+)+/i, '') : 'Clinician'}
                      </span>
                      <span className="block text-xs text-primary font-bold mt-0.5 truncate">
                        {d.specialization || 'General Dentistry'}
                      </span>
                      
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
                        <Building size={12} className="text-slate-400 icon-animated" />
                        <span className="truncate">{d.institution || 'Independent Practice'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5 font-medium">
                        <MapPin size={12} className="text-slate-400 icon-animated" />
                        <span className="truncate">{d.location || 'Location unspecified'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}

