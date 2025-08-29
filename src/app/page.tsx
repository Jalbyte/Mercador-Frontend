import Link from 'next/link';
import { FiSearch, FiShoppingCart, FiUser, FiChevronDown } from 'react-icons/fi';

type LicenseCardProps = {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
};

const licenses: LicenseCardProps[] = [
  {
    id: 1,
    title: 'Microsoft Office 365',
    description: 'Licencia anual para 5 dispositivos',
    price: 89.99,
    category: 'Productividad'
  },
  {
    id: 2,
    title: 'Adobe Creative Cloud',
    description: 'Acceso completo a todas las aplicaciones de Adobe',
    price: 59.99,
    category: 'Diseño'
  },
  {
    id: 3,
    title: 'Windows 11 Pro',
    description: 'Licencia de actualización para un PC',
    price: 199.99,
    category: 'Sistema Operativo'
  },
  {
    id: 4,
    title: 'Norton 360 Deluxe',
    description: 'Protección antivirus para 5 dispositivos',
    price: 49.99,
    category: 'Seguridad'
  },
];

const LicenseCard = ({ title, description, price, category }: LicenseCardProps) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
    <div className="p-6">
      <span className="text-sm text-blue-600 font-medium">{category}</span>
      <h3 className="text-xl font-semibold mt-2 mb-1">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <span className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</span>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
          Agregar al carrito
        </button>
      </div>
    </div>
  </div>
);

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Mercador
            </Link>
            
            <div className="relative flex-1 max-w-2xl">
              <input
                type="text"
                placeholder="Buscar licencias..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                <FiSearch size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-700 hover:text-blue-600">
                <FiUser size={20} />
                <span>Iniciar sesión</span>
              </button>
              <button className="relative p-2 text-gray-700 hover:text-blue-600">
                <FiShoppingCart size={24} />
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
          
          <nav className="mt-4">
            <ul className="flex gap-6 text-sm font-medium">
              <li><a href="#" className="hover:text-blue-600">Inicio</a></li>
              <li className="flex items-center gap-1">
                <a href="#" className="hover:text-blue-600">Categorías</a>
                <FiChevronDown size={16} />
              </li>
              <li><a href="#" className="hover:text-blue-600">Ofertas</a></li>
              <li><a href="#" className="hover:text-blue-600">Nuevo</a></li>
              <li><a href="#" className="hover:text-blue-600">Soporte</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Licencias de Software al Mejor Precio</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Encuentra las mejores ofertas en licencias de software originales con garantía y soporte técnico</p>
          <button className="bg-white text-blue-700 px-8 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
            Ver Ofertas Especiales
          </button>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Licencias Populares</h2>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
              Categorías
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Ver Todas
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {licenses.map((license) => (
            <LicenseCard key={license.id} {...license} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Mercador</h3>
              <p className="text-gray-400">Tu tienda confiable de licencias de software originales al mejor precio.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Sobre Nosotros</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Trabaja con Nosotros</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Términos y Condiciones</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Política de Privacidad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Centro de Ayuda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contacto</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Preguntas Frecuentes</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Métodos de Pago</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>contacto@mercador.com</li>
                <li>+1 234 567 890</li>
                <li>Bogotá, Colombia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p> 2024 Mercador. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}