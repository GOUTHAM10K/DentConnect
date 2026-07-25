import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { submitInquiry } from '../services/dentconnectService';
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarCheck2,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const featureCards = [
  {
    title: 'Secure case library',
    description: 'Store treatment notes, imaging summaries, and consent records in one organized workspace.',
    icon: ShieldCheck,
  },
  {
    title: 'Live specialist collaboration',
    description: 'Send case updates, request second opinions, and keep every discussion in one place.',
    icon: MessageCircleMore,
  },
  {
    title: 'AI-guided insights',
    description: 'Turn complex cases into smart follow-up tasks with structured recommendations and reminders.',
    icon: BrainCircuit,
  },
];

export default function Welcome() {
  const [showSplash, setShowSplash] = useState(true);
  const [stats, setStats] = useState({ doctors: '1K+', cases: '8K+', regions: '18+' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: 'General Dentistry',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/');
      return;
    }

    const timer = setTimeout(() => setShowSplash(false), 1400);

    const loadStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const postsSnap = await getDocs(collection(db, 'posts'));
        setStats({
          doctors: `${Math.max(usersSnap.size, 120)}+`,
          cases: `${Math.max(postsSnap.size, 800)}+`,
          regions: '24+',
        });
      } catch (error) {
        console.error('Unable to load DentConnect stats:', error);
      }
    };

    loadStats();
    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInquirySubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback('');

    try {
      await submitInquiry(formData);
      setFeedback('Thanks! Your demo request is on its way to the DentConnect team.');
      setFormData({ name: '', email: '', specialty: 'General Dentistry', notes: '' });
    } catch (error) {
      console.error('Inquiry submit failed:', error);
      setFeedback('We could not submit the request right now. Please try again shortly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showSplash) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(126,112,197,0.16),_transparent_55%)] px-6 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-5xl font-extrabold text-white shadow-xl shadow-primary/30 animate-pulse">
          D
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-800">DentConnect</h1>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.35em] text-primary">AI-Powered Dental Platform</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(126,112,197,0.15),_transparent_40%)] text-slate-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-8">
        <Link to="/welcome" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white shadow-lg shadow-primary/20">
            D
          </div>
          <div>
            <p className="text-base font-extrabold tracking-tight text-slate-800">DentConnect</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">Clinical network</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary sm:inline-flex">
            Sign in
          </Link>
          <Link to="/signup" className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover">
            Request access
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-16 px-6 pb-20 lg:px-8">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Sparkles size={16} />
              New • AI-assisted case collaboration
            </div>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight text-slate-900 sm:text-5xl">
                Build a smarter, more connected dental practice.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-slate-600">
                DentConnect helps dentists document cases, share insights with specialists, and keep patients moving with secure collaboration from first consult to follow-up.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover">
                Create your free account
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary">
                Explore the demo workspace
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{stats.doctors}</p>
                <p className="mt-1 text-sm text-slate-500">active clinicians</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{stats.cases}</p>
                <p className="mt-1 text-sm text-slate-500">shared cases</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-black text-slate-900">{stats.regions}</p>
                <p className="mt-1 text-sm text-slate-500">coverage regions</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
            <div className="rounded-3xl bg-slate-900 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Live panel</p>
                  <p className="mt-2 text-xl font-semibold">Case handoff in real time</p>
                </div>
                <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">Online</div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold">Patient Ref: D-2048</p>
                  <p className="mt-1 text-sm text-slate-300">Referred for endodontic consultation • 9:15 AM</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                  <p className="text-sm font-semibold">Specialist notes shared</p>
                  <p className="mt-1 text-sm text-slate-300">Dr. Priya added treatment timeline and imaging summary</p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <CalendarCheck2 size={16} />
                  <span className="text-sm font-semibold">Follow-up automation</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Auto-remind every clinician about pending review tasks.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Users size={16} />
                  <span className="text-sm font-semibold">Community access</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">Connect with peers and specialist groups around the world.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={18} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">{card.description}</p>
              </div>
            );
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-600">
              <BadgeCheck size={16} />
              Trusted by modern clinics
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-900">Everything your dental team needs in one secure space</h2>
            <ul className="mt-6 space-y-3 text-sm leading-7 text-slate-600">
              <li>• Unified patient case records with role-based access.</li>
              <li>• Structured collaboration for consultations, referrals, and follow-ups.</li>
              <li>• Connected dashboards that make growth and operations easy to manage.</li>
            </ul>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-900 p-8 text-white shadow-sm">
            <h2 className="text-2xl font-black">Book a live demo</h2>
            <p className="mt-2 text-sm text-slate-300">Tell us about your workflow and we will tailor the onboarding experience.</p>

            <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400"
                  required
                />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Work email"
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400"
                  required
                />
              </div>

              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
              >
                <option value="General Dentistry">General Dentistry</option>
                <option value="Orthodontics">Orthodontics</option>
                <option value="Endodontics">Endodontics</option>
                <option value="Oral Surgery">Oral Surgery</option>
                <option value="Prosthodontics">Prosthodontics</option>
              </select>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us what you want to streamline"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                {submitting ? 'Sending request...' : 'Request a demo'}
                <ArrowRight size={16} />
              </button>

              {feedback ? <p className="text-sm text-slate-300">{feedback}</p> : null}
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© 2026 DentConnect. Built for modern dental teams.</p>
          <div className="flex gap-4">
            <Link to="/signup" className="font-semibold text-primary">Join now</Link>
            <Link to="/support" className="font-semibold text-slate-600">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
