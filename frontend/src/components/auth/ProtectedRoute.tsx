import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gbrc-bg flex items-center justify-center relative overflow-hidden bg-grid">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gbrc-accent/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gbrc-cyan/10 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="glass-card p-8 flex flex-col items-center gap-4 max-w-sm w-full text-center relative z-10 border border-gbrc-card-border/40">
          <div className="relative w-16 h-16">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-2 border-gbrc-accent/20 border-t-gbrc-accent animate-spin" />
            {/* Inner pulsing core */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gbrc-accent to-gbrc-cyan opacity-80 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gbrc-accent to-gbrc-cyan flex items-center justify-center font-bold text-white text-xs">
              G
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Authenticating GBRC Session</h3>
            <p className="text-gbrc-text-dim text-xs mt-1">Verifying credentials and reputation index...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
