import React, { useState } from 'react';
import { submitSupportTicket } from '../services/dentconnectService';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  AlertTriangle,
  Info,
  FileText,
  ShieldCheck,
  Send,
  CheckCircle
} from 'lucide-react';

export default function Support() {
  // TABS: 'faq', 'contact', 'legal'
  const [activeTab, setActiveTab] = useState('faq');
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  // Form states
  const [ticket, setTicket] = useState({ type: 'support', subject: '', description: '', severity: 'low' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const faqs = [
    { q: "Is patient medical data secure under HIPAA standards?", a: "Yes, all patient clinical files and digital signatures are encrypted. DentConnect does not index patient identifiers in public network search results, adhering strictly to patient privacy parameters." },
    { q: "How do I export patient case reports to PDF?", a: "Navigate to the case file inside the Cases Directory, click the 'Print / PDF' action button at the top header, which generates a print-ready clean clinical sheet." },
    { q: "How does the AI auto-documentation feature compile case logs?", a: "The auto-documentation engine parses your chief complaints, dental history, and pulp test results, formatting them into structured clinician letter drafts instantly." },
    { q: "How do I annotate uploaded clinical images?", a: "In Step 2 of the Case Wizard, click on any uploaded image thumbnail to open the Superimposed Image Editor, where you can draw shapes, apply brightness levels, or color code findings." }
  ];

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      await submitSupportTicket(ticket);
      setSuccess(true);
      setTicket({ type: 'support', subject: '', description: '', severity: 'low' });
    } catch (err) {
      console.error(err);
      alert('Failed to send request: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(faqSearch.toLowerCase()) || 
    faq.a.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      
      {/* Support Section Header */}
      <div className="flex bg-white p-4 rounded-2xl border border-slate-100 shadow-soft flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl shrink-0"><HelpCircle size={20} /></div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Support Center</h2>
            <p className="text-xs text-slate-400 font-medium">Find answers, submit tickets or read platform terms</p>
          </div>
        </div>

        <div className="flex bg-slate-50 p-1.5 rounded-xl border border-slate-200/50 flex-wrap gap-1 w-full md:w-auto">
          {['faq', 'contact', 'legal'].map((t) => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setSuccess(false); }}
              className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-lg transition-all capitalize ${
                activeTab === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t === 'faq' ? 'FAQ / Help' : t === 'contact' ? 'Contact Support' : 'Legal & Policies'}
            </button>
          ))}
        </div>
      </div>

      {/* TABS VIEWS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content panel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-soft space-y-6">
          
          {/* VIEW 1: FAQ / Help Center (Screen 65, 66) */}
          {activeTab === 'faq' && (
            <div className="space-y-6">
              {/* Search faq */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5">
                <Search size={16} className="text-slate-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search FAQ guides..." 
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="bg-transparent text-xs border-none p-0 outline-none w-full text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-3.5">
                {filteredFaqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden">
                      <button 
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full flex justify-between items-center p-4 bg-slate-50/50 hover:bg-slate-50 text-left transition-colors"
                      >
                        <span className="text-xs font-bold text-slate-700 leading-normal">{faq.q}</span>
                        {isOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                      </button>
                      
                      {isOpen && (
                        <div className="p-4 bg-white border-t border-slate-50 text-xs text-slate-500 leading-relaxed font-semibold">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: Contact Support / Report Issue (Screen 67, 68) */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              {success && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fade-in">
                  <CheckCircle size={16} />
                  <span>Support request submitted! Our clinician support team will reply via email.</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Request Category</label>
                  <select 
                    value={ticket.type}
                    onChange={(e) => setTicket(prev => ({ ...prev, type: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                  >
                    <option value="support">Help Center / Support Inquiry (Screen 67)</option>
                    <option value="bug">Report System Issue / Bug (Screen 68)</option>
                    <option value="feedback">Product Feedback</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Subject</label>
                  <input 
                    type="text" 
                    placeholder="Short summary of issue..."
                    value={ticket.subject}
                    onChange={(e) => setTicket(prev => ({ ...prev, subject: e.target.value }))}
                    className="py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary text-xs w-full"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Priority Severity</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high'].map(sev => (
                      <button 
                        key={sev}
                        type="button"
                        onClick={() => setTicket(prev => ({ ...prev, severity: sev }))}
                        className={`flex-1 py-1.5 border text-xs font-bold rounded-lg transition-colors capitalize ${
                          ticket.severity === sev 
                            ? 'bg-primary/10 border-primary text-primary' 
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Description Details</label>
                  <textarea 
                    rows="5" 
                    placeholder="Explain clinical requirements or errors details..."
                    value={ticket.description}
                    onChange={(e) => setTicket(prev => ({ ...prev, description: e.target.value }))}
                    className="py-3 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white text-xs w-full resize-none"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-md shadow-primary/10 transition-all duration-200 flex justify-center items-center gap-2"
                >
                  {loading ? 'Sending...' : (
                    <>
                      <Send size={13} />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: About, Terms, Privacy (Screen 69, 70, 71) */}
          {activeTab === 'legal' && (
            <div className="space-y-6">
              
              {/* About (Screen 69) */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pl-0.5">
                  <Info size={14} className="text-primary" />
                  <span>About DentConnect</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  DentConnect is an AI-powered clinical documentation and peer networking platform exclusively designed for dentists. We facilitate secure radiographic and clinical attachments recordkeeping, and allow dentists to collaborate on complex cases.
                </p>
              </section>

              {/* Terms (Screen 70) */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pl-0.5">
                  <FileText size={14} className="text-primary" />
                  <span>Terms of Service</span>
                </h3>
                <div className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                  <p>1. Dentists are solely responsible for ensuring patient identities are de-identified before posting public cases.</p>
                  <p>2. Consents captured via Digital Signature pads are logged locally on clinician records.</p>
                </div>
              </section>

              {/* Privacy (Screen 71) */}
              <section className="space-y-2">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 pl-0.5">
                  <ShieldCheck size={14} className="text-primary" />
                  <span>Privacy Policy</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  All dental photography and clinical logs are stored securely using Firebase Storage buckets. We do not sell dentist metadata, and profile settings can be updated to private visibility instantly.
                </p>
              </section>

            </div>
          )}

        </div>

        {/* Right side Info Card panel */}
        <div>
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-800 pb-2 border-b border-slate-50 flex items-center gap-1.5">
              <Mail size={14} className="text-primary" />
              <span>Contact Coordinates</span>
            </h3>
            
            <div className="space-y-3.5 text-xs text-slate-600 font-semibold pl-0.5">
              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Clinician Hotline</span>
                <span>support@dentconnect.org</span>
              </div>

              <div>
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Incident Severity Center</span>
                <span className="flex items-center gap-1 mt-0.5 text-amber-600">
                  <AlertTriangle size={12} />
                  <span>Report severe outages</span>
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
