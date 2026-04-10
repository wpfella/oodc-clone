import React, { useState } from 'react';
import { CrownLogo } from './common/IconComponents';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  sendPasswordResetEmail,
  signOut
} from '../firebase';
import firebaseConfig from '../firebase-applet-config.json';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onLoginSuccess: () => void;
  correctPassword: string;
}

type AuthMode = 'login' | 'signup' | 'forgot-password';

const LoginScreen: React.FC<Props> = ({ onLoginSuccess, correctPassword }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleMasterPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (masterPassword === correctPassword) {
      onLoginSuccess();
    } else {
      setError('Incorrect master password. Please try again.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
      setError('Firebase is not yet configured. Please check the setup instructions.');
      setLoading(false);
      return;
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const userEmail = result.user.email;
      if (userEmail && (userEmail.endsWith('@crown.money') || userEmail.endsWith('@outofdebt.com.au'))) {
        onLoginSuccess();
      } else {
        await signOut(auth);
        setError('Access restricted to @crown.money and @outofdebt.com.au accounts only.');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled.');
      } else {
        setError(`Failed to login with Google: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!email.endsWith('@crown.money') && !email.endsWith('@outofdebt.com.au')) {
      setError('Only @crown.money or @outofdebt.com.au email addresses are allowed.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setMessage('Verification email sent! Please verify your email before logging in.');
        setMode('login');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.emailVerified) {
          onLoginSuccess();
        } else {
          await signOut(auth);
          setError('Please verify your email address before logging in.');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F8F8F8] to-[#E6DEEE] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/50 backdrop-blur-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mb-6"
          >
            <CrownLogo className="h-20 w-auto" />
          </motion.div>
          <h1 className="text-3xl font-black text-[#250B40] tracking-tight text-center">Out of Debt</h1>
          <p className="text-[#583d77] text-sm mt-2 font-bold uppercase tracking-[0.2em] opacity-60">
            Calculator Portal
          </p>
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {mode === 'forgot-password' ? (
              <motion.form
                key="forgot-password"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleForgotPassword}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-[#250B40] uppercase tracking-[0.2em] ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-[#F8F8F8] border-2 border-[#E6DEEE] rounded-2xl focus:ring-4 focus:ring-[#5B21B6]/10 focus:border-[#5B21B6] transition-all outline-none text-[#250B40] font-bold"
                    placeholder="name@crown.money"
                    required
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full py-5 bg-[#5B21B6] text-white rounded-2xl font-black text-lg shadow-xl shadow-[#5B21B6]/30 hover:bg-[#4c1d95] transition-all uppercase tracking-widest disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-xs text-[#5B21B6] font-bold uppercase tracking-widest">
                  Back to Login
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Prominent Master Password Section */}
                <form onSubmit={handleMasterPasswordSubmit} className="space-y-4 bg-[#f8f6fb] p-5 rounded-2xl border border-[#d2c2e5]">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[#250B40] uppercase tracking-[0.2em] ml-1">Master Access</label>
                    <input
                      type="password"
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-[#E6DEEE] rounded-xl focus:ring-4 focus:ring-[#5B21B6]/10 focus:border-[#5B21B6] transition-all outline-none text-[#250B40] font-bold"
                      placeholder="Enter Master Password"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-[#5B21B6] text-white rounded-xl font-black text-sm shadow-md hover:bg-[#4c1d95] transition-all uppercase tracking-widest">
                    Quick Login
                  </button>
                </form>

                <div className="relative pt-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t-2 border-[#E6DEEE] border-dashed"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em]">
                    <span className="bg-white px-4 text-[#583d77] font-black">Or use account</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-6 bg-white border-2 border-[#E6DEEE] text-[#250B40] rounded-xl font-black flex items-center justify-center gap-4 hover:border-[#5B21B6] hover:bg-[#F8F8F8] transition-all shadow-sm disabled:opacity-50"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                  <span className="text-sm uppercase tracking-widest">
                    Google Login
                  </span>
                </motion.button>

                <form onSubmit={handleEmailPasswordAuth} className="space-y-3">
                  <div className="space-y-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border-2 border-[#E6DEEE] rounded-xl focus:ring-4 focus:ring-[#5B21B6]/10 focus:border-[#5B21B6] transition-all outline-none text-[#250B40] font-bold text-sm"
                      placeholder="Email (name@crown.money)"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F8F8F8] border-2 border-[#E6DEEE] rounded-xl focus:ring-4 focus:ring-[#5B21B6]/10 focus:border-[#5B21B6] transition-all outline-none text-[#250B40] font-bold text-sm"
                      placeholder="Password"
                      required
                    />
                  </div>
                  
                  <div className="flex justify-between items-center mb-1">
                    {mode === 'login' && (
                      <button type="button" onClick={() => setMode('forgot-password')} className="text-[10px] text-[#5B21B6] font-bold uppercase tracking-widest ml-1">
                        Forgot Password?
                      </button>
                    )}
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3 bg-[#e4daf1] text-[#250B40] rounded-xl font-black text-sm hover:bg-[#d0bfe3] transition-all uppercase tracking-widest disabled:opacity-50">
                    {loading ? 'Processing...' : mode === 'login' ? 'Login with Email' : 'Sign Up with Email'}
                  </button>
                </form>

                <div className="text-center mt-2">
                  <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-[10px] text-[#5B21B6] font-bold uppercase tracking-widest opacity-80">
                    {mode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Login"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {(error || message) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center ${error ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
              >
                {error || message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 text-center pt-4 border-t border-dashed border-[#E6DEEE]">
          <div className="inline-flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[9px] text-[#583d77] uppercase tracking-[0.2em] font-black">Secure Portal</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginScreen;

