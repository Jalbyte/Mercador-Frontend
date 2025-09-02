import React, { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  className?: string;
}

export const AuthLayout = ({ children, className = '' }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex items-center justify-center px-4 py-12">
        <div className={`w-full max-w-md ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
};
