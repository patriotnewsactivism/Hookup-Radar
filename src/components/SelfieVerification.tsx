import React from 'react';
import { Camera, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  inline?: boolean;
}

export function SelfieVerification({ inline = false }: Props) {
  const { profile } = useAuth();
  const isVerified = profile?.is_verified;

  if (isVerified) {
    return (
      <div className="bg-green-900/20 border border-green-700/30 rounded-2xl p-4 flex items-center gap-3">
        <CheckCircle size={18} className="text-green-400" />
        <div>
          <p className="text-white text-sm font-semibold">Verified ✓</p>
          <p className="text-gray-500 text-xs">Your identity has been confirmed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
      <Camera size={18} className="text-blue-400" />
      <div>
        <p className="text-white text-sm font-semibold">Selfie Verification</p>
        <p className="text-gray-500 text-xs">Coming soon — prove you're real</p>
      </div>
    </div>
  );
}
