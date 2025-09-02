import { FiArrowLeft, FiShield } from 'react-icons/fi';

interface AuthHeaderProps {
  onBack?: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const AuthHeader = ({ onBack, title, subtitle, icon }: AuthHeaderProps) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center text-white">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
      {icon}
    </div>
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-blue-100">{subtitle}</p>
    
    {onBack && (
      <button
        type="button"
        onClick={onBack}
        className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Volver atrás"
      >
        <FiArrowLeft size={20} />
      </button>
    )}
    
    <div className="absolute top-4 right-4 flex items-center gap-2 text-sm text-blue-100">
      <FiShield size={16} />
      <span>Conexión Segura</span>
    </div>
  </div>
);
