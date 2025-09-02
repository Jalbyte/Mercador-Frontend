import React from "react";

interface SocialLoginProps {
  onGoogleLogin?: () => void;
}

export const SocialLogin = ({
  onGoogleLogin,
}: SocialLoginProps) => (
  <>
    <div className="flex items-center my-6">
      <div className="flex-1 border-t border-gray-300"></div>
      <span className="px-4 text-sm text-gray-500">O continúa con</span>
      <div className="flex-1 border-t border-gray-300"></div>
    </div>

    <div className="flex justify-center">
      <button
        type="button"
        onClick={onGoogleLogin}
        className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full max-w-xs"
      >
        <img
          src="https://developers.google.com/identity/images/g-logo.png"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        <span className="text-sm font-medium text-gray-700">Continuar con Google</span>
      </button>
    </div>
  </>
);
