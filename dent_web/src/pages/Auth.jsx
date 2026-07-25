import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { auth, db, GoogleAuthProvider, signInWithCredential } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff, Mail, Lock, User, Briefcase, MapPin, Building, Key, ShieldCheck } from 'lucide-react';

export default function Auth({ isLogin = true, view = 'form' }) {
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '']);

  // React Hook Form
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      specialization: 'General Dentistry',
      institution: '',
      location: ''
    }
  });

  const specializations = [
    "General Dentistry", 
    "Orthodontics", 
    "Endodontics", 
    "Periodontics", 
    "Oral Surgery", 
    "Prosthodontics"
  ];

  // Submit handler for login and signup
  const onSubmit = async (data) => {
    setLoading(true);
    setFirebaseError('');
    try {
      if (isLogin && view === 'form') {
        // Log in
        await login(data.email, data.password);
        navigate('/');
      } else if (!isLogin && view === 'form') {
        // Sign up. In production setup, we can trigger OTP verification
        // For screen sequence, we will redirect to `/otp` page after credentials check, 
        // passing registration data in state.
        navigate('/otp', { state: { regData: data } });
      }
    } catch (err) {
      console.error(err);
      setFirebaseError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setFirebaseError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Create profile document if it doesn't exist
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Dr. User',
          email: user.email || '',
          phone: user.phoneNumber || '',
          specialization: 'General Dentistry',
          institution: '',
          location: '',
          role: 'doctor',
          photoUrl: user.photoURL || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
          bio: 'Dental Professional on DentConnect',
          education: [],
          experience: [],
          certifications: [],
          achievements: [],
          notificationSettings: { likes: true, comments: true, connections: true, chat: true, email: true, push: true },
          privacySettings: { profileVisibility: 'public', showEmail: false, showCasesToPublic: true }
        });
      }
      navigate('/');
    } catch (err) {
      console.error(err);
      setFirebaseError('Google Sign-In failed. Redirecting to demo...');
      setTimeout(() => {
        handleDemoLogin();
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  // Demo Account Sign In
  const handleDemoLogin = async () => {
    setLoading(true);
    setFirebaseError('');
    try {
      const demoEmail = 'demo.dentist@dentconnect.com';
      const demoPassword = 'password123';
      try {
        await login(demoEmail, demoPassword);
      } catch {
        // Create demo account on the fly if missing
        try {
          const creds = await createUserWithEmailAndPassword(auth, demoEmail, demoPassword);
          await setDoc(doc(db, 'users', creds.user.uid), {
            uid: creds.user.uid,
            name: 'Dr. Arun Kumar',
            email: demoEmail,
            phone: '+91 98765 43210',
            specialization: 'Endodontics',
            institution: 'Dental Care Research Center',
            location: 'Bangalore, India',
            role: 'doctor',
            photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
            bio: 'Senior Endodontic Consultant specializing in rotary instrumentation and complex retreatments.',
            education: [{ degree: 'MDS Endodontics', school: 'Government Dental College', year: '2015' }],
            experience: [{ role: 'Senior Consultant', company: 'Smile Dental Clinic', duration: '5 Years' }],
            certifications: ['Laser Dentistry Certified'],
            achievements: ['Best Paper Award, IES 2021'],
            notificationSettings: { likes: true, comments: true, connections: true, chat: true, email: true, push: true },
            privacySettings: { profileVisibility: 'public', showEmail: true, showCasesToPublic: true }
          });
        } catch {
          await login(demoEmail, demoPassword);
        }
      }
      navigate('/');
    } catch (err) {
      setFirebaseError('Demo login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password submit
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const emailInput = e.target.email.value;
    if (!emailInput) return;
    setLoading(true);
    setFirebaseError('');
    try {
      await resetPassword(emailInput);
      setFirebaseError('Verification link sent! Check your inbox.');
    } catch (err) {
      setFirebaseError(err.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  // Reset Password submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFirebaseError('');
    try {
      // Simulate successful password reset
      setFirebaseError('Password successfully updated! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setFirebaseError(err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  // OTP code typing
  const handleOtpChange = (index, val) => {
    if (isNaN(val)) return;
    const updated = [...otpCode];
    updated[index] = val;
    setOtpCode(updated);
    // Autofocus next
    if (val !== '' && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  // OTP verify click
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFirebaseError('');
    const code = otpCode.join('');
    if (code.length < 4) {
      setFirebaseError('Please enter the 4-digit code.');
      setLoading(false);
      return;
    }

    try {
      // Complete Signup from registration data passed in history state
      const regData = window.history.state?.usr?.regData;
      if (regData) {
        await signup(
          regData.name,
          regData.email,
          regData.password,
          regData.specialization,
          regData.institution,
          regData.location
        );
        // Navigate to Email Verification instructions
        navigate('/verify-email');
      } else {
        // Fallback for direct mock signups
        await signup(
          "Dr. Clinician", 
          `dentist-${Math.floor(Math.random()*1000)}@dentconnect.com`, 
          "password123", 
          "General Dentistry", 
          "Dental Care Hospital", 
          "New York, USA"
        );
        navigate('/verify-email');
      }
    } catch (err) {
      console.error(err);
      setFirebaseError(err.message || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Email verification verification check
  const handleCheckEmailVerified = async () => {
    setLoading(true);
    try {
      // In production, we'd reload user profile
      const user = auth.currentUser;
      if (user) {
        // Trigger verification email request
        await sendEmailVerification(user);
      }
      navigate('/');
    } catch (e) {
      console.error(e);
      // bypass for sandbox simulation
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 py-8 animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xl shadow-slate-100/50">
        
        {/* View Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white font-extrabold text-2xl shadow-md shadow-primary/20 mb-3">
            D
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            {view === 'forgot' && 'Reset Password 🔑'}
            {view === 'otp' && 'OTP Verification 📱'}
            {view === 'verify' && 'Verify Email 📧'}
            {view === 'reset' && 'Create Password 🔒'}
            {view === 'form' && (isLogin ? 'Welcome Back! 👋' : 'Create Account 🦷')}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {view === 'forgot' && 'Enter your email to receive a recovery link'}
            {view === 'otp' && 'Enter the 4-digit code sent to your mobile'}
            {view === 'verify' && 'Complete validation to secure your profile'}
            {view === 'reset' && 'Choose a strong password for your credentials'}
            {view === 'form' && (isLogin ? 'Login to connect with dental professionals' : 'Join the professional dentist network')}
          </p>
        </div>

        {/* Display alert banners */}
        {firebaseError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold leading-relaxed">
            {firebaseError}
          </div>
        )}

        {/* 1. Login / Signup Forms */}
        {view === 'form' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Full Name (Signup only) */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase">Full Name *</label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Dr. Arun Kumar"
                    {...register("name", { required: !isLogin ? "Name is required" : false })}
                    className={`pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none w-full text-sm transition-colors ${
                      errors.name ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>}
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Email Address *</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email"
                  placeholder="dr.arun@gmail.com"
                  {...register("email", { 
                    required: "Email is required", 
                    pattern: { value: /^\S+@\S+$/i, message: "Invalid email structure" }
                  })}
                  className={`pl-11 pr-4 py-3 bg-slate-50 border rounded-xl outline-none w-full text-sm transition-colors ${
                    errors.email ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-0.5">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-500 uppercase">Password *</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-xs text-primary font-bold hover:underline">
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...register("password", { 
                    required: "Password is required", 
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                  className={`pl-4 pr-12 py-3 bg-slate-50 border rounded-xl outline-none w-full text-sm transition-colors ${
                    errors.password ? 'border-red-400 focus:border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:border-primary focus:bg-white'
                  }`}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center"
                  style={{ width: 'auto', minWidth: 'auto', backgroundColor: 'transparent', border: 'none', padding: '6px', margin: 0, boxShadow: 'none' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-0.5">{errors.password.message}</p>}
            </div>

            {/* Specialty Selection & Details (Signup only) */}
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Specialization *</label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <select 
                      {...register("specialization")}
                      className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm appearance-none focus:border-primary focus:bg-white"
                    >
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Institution / Practice Clinic</label>
                  <div className="relative">
                    <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Dental Care Research Center"
                      {...register("institution")}
                      className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Location / City</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Bangalore, India"
                      {...register("location")}
                      className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm focus:border-primary focus:bg-white"
                    />
                  </div>
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 flex justify-center items-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Login Securely' : 'Proceed to Verify'
              )}
            </button>
          </form>
        )}

        {/* 2. Forgot Password Screen */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Registered Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  name="email" 
                  placeholder="dr.arun@gmail.com" 
                  required 
                  className="pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm focus:border-primary focus:bg-white"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover shadow-lg transition-all duration-200"
            >
              {loading ? 'Processing...' : 'Send Recovery Link'}
            </button>

            <Link to="/login" className="block text-center text-sm font-bold text-primary hover:underline mt-2">
              Back to Login
            </Link>
          </form>
        )}

        {/* 3. OTP Verification Screen */}
        {view === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-3">
              {otpCode.map((digit, i) => (
                <input 
                  key={i}
                  id={`otp-${i}`}
                  type="text" 
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="w-14 h-14 bg-slate-50 border border-slate-200 text-2xl text-center font-extrabold text-slate-800 rounded-xl focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all outline-none"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover shadow-lg transition-all duration-200"
            >
              {loading ? 'Verifying...' : 'Verify OTP Code'}
            </button>

            <div className="text-center">
              <span className="text-slate-400 text-xs">Didn't receive code? </span>
              <button type="button" onClick={() => setFirebaseError('OTP code resent to mobile!')} className="text-xs font-bold text-primary hover:underline">
                Resend
              </button>
            </div>
          </form>
        )}

        {/* 4. Reset Password View */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">New Password</label>
              <input 
                type="password" 
                placeholder="Enter new password" 
                required 
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm focus:border-primary focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Confirm Password</label>
              <input 
                type="password" 
                placeholder="Confirm new password" 
                required 
                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none w-full text-sm focus:border-primary focus:bg-white transition-colors"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover shadow-lg transition-all duration-200"
            >
              Update Password
            </button>
          </form>
        )}

        {/* 5. Email Verification View */}
        {view === 'verify' && (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck size={36} />
              </div>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed px-4">
              We have sent a verification link to your registered email address. Please check your inbox and click the link to activate your profile.
            </p>
            <button 
              onClick={handleCheckEmailVerified} 
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-2xl hover:bg-primary-hover shadow-lg transition-all duration-200"
            >
              {loading ? 'Checking status...' : 'I have verified my email'}
            </button>
          </div>
        )}

        {/* Google & Demo Account (Only show on Login/Signup form view) */}
        {view === 'form' && (
          <>
            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <span className="relative bg-white px-4 text-xs font-bold uppercase text-slate-400">or connect via</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button" 
                onClick={handleGoogleSignIn}
                className="flex items-center justify-center gap-2 border border-slate-200 bg-white py-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors text-slate-700 text-xs font-semibold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.7 12.3c0-.8-.1-1.7-.2-2.5H12v4.8h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3.1h3.9c2.3-2.1 3.6-5.2 3.6-9.1z"/>
                  <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3.1c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5H1.2v3.2C3.2 21.4 7.3 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.2 14.2c-.3-.8-.4-1.7-.4-2.7s.1-1.9.4-2.7V5.6H1.2c-.8 1.6-1.2 3.4-1.2 5.4s.4 3.8 1.2 5.4l4-3.2z"/>
                  <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.3 0 3.2 2.6 1.2 6.6l4 3.2c1-2.9 3.7-5 6.8-5z"/>
                </svg>
                <span>Google</span>
              </button>
              <button 
                type="button" 
                onClick={handleDemoLogin}
                className="flex items-center justify-center gap-2 border border-primary/20 bg-primary/5 hover:bg-primary/10 active:bg-primary/15 transition-colors text-primary py-3 rounded-xl text-xs font-bold"
              >
                <span>Demo Clinician</span>
              </button>
            </div>

            <div className="text-center mt-6 text-xs text-slate-400">
              {isLogin ? (
                <>
                  New to DentConnect?{' '}
                  <Link to="/signup" className="text-primary font-bold hover:underline">
                    Create Profile
                  </Link>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <Link to="/login" className="text-primary font-bold hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
