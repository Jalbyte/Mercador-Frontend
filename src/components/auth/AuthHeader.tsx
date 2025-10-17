import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";

interface AuthHeaderProps {
  onBack?: () => void;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  hideBackToHome?: boolean;
}

export const AuthHeader = ({
  onBack,
  title,
  subtitle,
  icon,
  hideBackToHome = false,
}: AuthHeaderProps) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-8 text-center text-white relative rounded-t-2xl">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
      {icon}
    </div>
    <h2 className="text-2xl font-bold mb-2">{title}</h2>
    <p className="text-blue-100">{subtitle}</p>

    {!hideBackToHome && (
      <Link
        href="/"
        className="absolute top-4 left-4 p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1 text-white"
        title="Volver al inicio"
      >
        <FiArrowLeft size={20} />
        <span className="text-sm font-medium">Inicio</span>
      </Link>
    )}
  </div>
);
