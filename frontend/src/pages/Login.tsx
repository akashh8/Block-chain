import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_PRESETS } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Factory, Truck, Building2, KeyRound, Mail, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';
import type { NodeRole } from '../types';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState<NodeRole | 'regulator'>('regulator');
  const [email, setEmail] = useState(ROLE_PRESETS[0].email);
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Get redirect path
  const from = (location.state as any)?.from?.pathname || '/';

  // If already authenticated, redirect
  if (isAuthenticated && !isSubmitting && !isSuccess) {
    navigate(from, { replace: true });
    return null;
  }

  const handleRoleSelect = (role: NodeRole | 'regulator') => {
    setSelectedRole(role);
    const preset = ROLE_PRESETS.find((p) => p.role === role);
    if (preset) {
      setEmail(preset.email);
      setPassword('cyber-secret-pass'); // Pre-populate mock password
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your organizational email');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, selectedRole);
      if (success) {
        setIsSuccess(true);
        // Beautiful quick success screen, then navigate
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1200);
      } else {
        setError('Invalid credentials or unauthorized network signature');
        setIsSubmitting(false);
      }
    } catch (err) {
      setError('A secure cryptographic handshake error occurred.');
      setIsSubmitting(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'regulator':
        return <Shield className="w-5 h-5" />;
      case 'manufacturer':
        return <Factory className="w-5 h-5" />;
      case 'distributor':
        return <Truck className="w-5 h-5" />;
      case 'pharmacy':
        return <Building2 className="w-5 h-5" />;
      default:
        return <KeyRound className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gbrc-bg flex items-center justify-center relative overflow-hidden bg-grid p-4 font-sans">
      {/* ─── Cyberpunk Ambient Glow Spheres ─── */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-gbrc-accent/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gbrc-cyan/10 rounded-full blur-[120px] animate-pulse-slow pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* ─── Floating Glowing Particle Accents ─── */}
      <div className="absolute top-[20%] right-[15%] w-3 h-3 bg-gbrc-accent rounded-full animate-ping opacity-20 pointer-events-none" />
      <div className="absolute bottom-[25%] left-[18%] w-2 h-2 bg-gbrc-cyan rounded-full animate-ping opacity-40 pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isSuccess ? (
          <motion.div
            key="login-form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-full max-w-2xl relative z-10"
          >
            {/* Main Premium Card */}
            <div className="glass-card p-8 md:p-10 border border-gbrc-card-border/45 bg-gbrc-card/75 shadow-2xl shadow-black/80 flex flex-col md:flex-row gap-10">
              
              {/* Left Side: Branding and Role preset cards */}
              <div className="md:w-5/12 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gbrc-card-border/30 pb-6 md:pb-0 md:pr-8">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gbrc-accent to-gbrc-cyan flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-gbrc-accent/35 ring-1 ring-white/20">
                      G
                    </div>
                    <div>
                      <h1 className="text-xl font-bold tracking-tight text-white leading-none">GBRC</h1>
                      <span className="text-xs font-semibold text-gbrc-cyan tracking-wider uppercase">Reputation Portal</span>
                    </div>
                  </div>

                  <h2 className="text-lg font-semibold text-white tracking-tight mb-2">Select Access Node</h2>
                  <p className="text-xs text-gbrc-text-dim leading-relaxed mb-6">
                    Log in as an authorized consensus participant. Choose a role to load mock security keys automatically.
                  </p>
                </div>

                {/* Preset List */}
                <div className="space-y-2.5">
                  {ROLE_PRESETS.map((preset) => {
                    const isSelected = selectedRole === preset.role;
                    return (
                      <button
                        key={preset.role}
                        type="button"
                        onClick={() => handleRoleSelect(preset.role)}
                        className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 transition-all duration-300 relative group ${
                          isSelected
                            ? 'bg-gbrc-accent/15 border-gbrc-accent/60 shadow-lg shadow-gbrc-accent/5'
                            : 'bg-white/[0.02] border-gbrc-card-border/30 hover:border-white/20 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-300 ${
                            isSelected
                              ? 'bg-gbrc-accent text-white shadow-md shadow-gbrc-accent/30'
                              : 'bg-white/5 text-gbrc-muted group-hover:text-white'
                          }`}
                        >
                          {getRoleIcon(preset.role)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold leading-tight uppercase tracking-wider ${
                            isSelected ? 'text-white' : 'text-gbrc-muted'
                          }`}>
                            {preset.role}
                          </h4>
                          <p className="text-[10px] text-gbrc-text-dim truncate mt-0.5 font-medium">{preset.name}</p>
                        </div>
                        {isSelected && (
                          <motion.div
                            layoutId="active-indicator"
                            className="absolute right-3 w-1.5 h-1.5 rounded-full bg-gbrc-cyan"
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Side: Log-in Credentials Form */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white tracking-tight">Security Handshake</h3>
                  <p className="text-xs text-gbrc-text-dim mt-1">Enter your organizational keys for ledger authorization.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Organizational Email Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gbrc-muted mb-2">
                      Organizational Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gbrc-text-dim" />
                      <input
                        type="email"
                        required
                        className="input-field w-full pl-11 text-sm bg-black/20 border-gbrc-card-border/40 focus:border-gbrc-accent focus:ring-1 focus:ring-gbrc-accent/40 rounded-xl"
                        placeholder="e.g. name@gbrc-authority.gov"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Private Key Input */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gbrc-muted mb-2">
                      Organizational Passkey / Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gbrc-text-dim" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        className="input-field w-full pl-11 pr-10 text-sm bg-black/20 border-gbrc-card-border/40 focus:border-gbrc-accent focus:ring-1 focus:ring-gbrc-accent/40 rounded-xl font-mono"
                        placeholder="Private security key"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gbrc-text-dim hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Error Notification */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-gbrc-slashed/10 border border-gbrc-slashed/30 rounded-xl text-gbrc-slashed text-xs font-medium"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-primary py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm cursor-pointer shadow-lg hover:shadow-gbrc-accent/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    ) : (
                      <>
                        <span>Establish Session</span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer disclaimer */}
                <div className="mt-6 pt-4 border-t border-gbrc-card-border/20 text-center">
                  <p className="text-[10px] text-gbrc-text-dim leading-relaxed">
                    This dashboard acts as a decentralized blockchain explorer. All consensus updates and signature logs are cryptographically sealed.
                  </p>
                </div>
              </div>
              
            </div>
          </motion.div>
        ) : (
          /* ─── Success Verification Screen ─── */
          <motion.div
            key="login-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="glass-card p-8 md:p-10 border border-gbrc-card-border bg-gbrc-card shadow-2xl text-center flex flex-col items-center">
              {/* Animating glow success ring */}
              <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="absolute inset-0 rounded-full bg-gbrc-trusted/10 border border-gbrc-trusted/30 shadow-lg shadow-gbrc-trusted/20"
                />
                
                {/* Success outer pulse */}
                <div className="absolute inset-[-10px] rounded-full border-2 border-gbrc-trusted/20 animate-ping opacity-60 pointer-events-none" />

                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 12 }}
                  className="relative z-10 w-12 h-12 rounded-full bg-gbrc-trusted flex items-center justify-center text-white shadow-lg shadow-gbrc-trusted/30"
                >
                  <svg
                    className="w-6 h-6 stroke-current"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
              </div>

              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-white font-bold text-xl tracking-tight"
              >
                Handshake Established
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-gbrc-cyan font-semibold text-xs tracking-wider uppercase mt-1"
              >
                Role: {selectedRole}
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-gbrc-text-dim text-xs leading-relaxed mt-4"
              >
                Verifying zero-knowledge proofs and fetching trust metrics from the network...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
