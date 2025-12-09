import React from 'react';
import { AlertTriangle, Settings, Clock } from 'lucide-react';

export interface MaintenanceModeProps {
  title?: string;
  message?: string;
  eta?: string;
  supportEmail?: string;
  className?: string;
}

export const MaintenanceMode: React.FC<MaintenanceModeProps> = ({
  title = 'We’ll be back soon!',
  message = 'Our site is currently undergoing scheduled maintenance. We’re working hard to improve your experience.',
  eta,
  supportEmail,
  className = '',
}) => {
  return (
    <div
      className={`
        flex min-h-screen items-center justify-center
        bg-gradient-to-br from-slate-50 to-slate-100
        px-4 py-12
        ${className}
      `}
    >
      <div
        className="
          w-full max-w-lg
          rounded-2xl bg-white
          p-8 shadow-xl
          ring-1 ring-slate-200
        "
      >
        <div className="mb-6 flex justify-center">
          <div
            className="
              rounded-full bg-amber-100 p-4
              text-amber-600
            "
          >
            <Settings className="h-10 w-10 animate-spin" />
          </div>
        </div>

        <h1 className="mb-3 text-center text-2xl font-bold text-slate-800">
          {title}
        </h1>

        <p className="mb-6 text-center text-slate-600">
          {message}
        </p>

        {eta && (
          <div className="mb-4 flex items-center justify-center gap-2 text-slate-600">
            <Clock className="h-5 w-5" />
            <span className="text-sm">
              Estimated completion: <strong>{eta}</strong>
            </span>
          </div>
        )}

        {supportEmail && (
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">
              Need help?{' '}
              <a
                href={`mailto:${supportEmail}`}
                className="font-medium text-amber-600 hover:underline"
              >
                Contact support
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceMode;
