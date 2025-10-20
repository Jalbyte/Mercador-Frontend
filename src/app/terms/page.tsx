"use client";

import Link from "next/link";
import Image from "next/image";
import { FiArrowLeft } from "react-icons/fi";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 space-y-8">
          {/* Last Updated */}
          <div className="flex items-center gap-2 text-sm text-gray-500 pb-6 border-b border-gray-200">
            <span>Última actualización: Octubre 2025</span>
          </div>

          {/* Introduction */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">1. Introducción</h2>
            <p className="text-gray-700 leading-relaxed">
              Bienvenido a <strong>Mercador</strong>, tu tienda confiable de licencias de software originales al mejor precio, con garantía y soporte técnico. Estos Términos y Condiciones ("Términos") regulan el uso de nuestro sitio web, aplicación móvil y servicios relacionados (colectivamente, los "Servicios").
            </p>
            <p className="text-gray-700 leading-relaxed">
              Al acceder y utilizar Mercador, aceptas estar vinculado por estos Términos. Si no estás de acuerdo con alguna parte de estos Términos, no debes utilizar nuestros Servicios.
            </p>
          </section>

          {/* User Accounts */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">2. Cuentas de Usuario</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.1 Registro</h3>
                <p className="text-gray-700 leading-relaxed">
                  Para realizar compras en Mercador, es necesario crear una cuenta. Debes proporcionar información precisa, completa y actualizada durante el proceso de registro.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.2 Verificación de Email</h3>
                <p className="text-gray-700 leading-relaxed">
                  Verificamos todos los correos electrónicos para garantizar la autenticidad de nuestros usuarios y prevenir fraudes. Recibirás un enlace de verificación que debes confirmar antes de poder acceder completamente a tu cuenta.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.3 Autenticación de Dos Factores (2FA)</h3>
                <p className="text-gray-700 leading-relaxed">
                  Por tu seguridad, ofrecemos autenticación de dos factores (2FA). Recomendamos encarecidamente que habilites esta función en tu cuenta. El 2FA añade una capa adicional de seguridad mediante la verificación de tu identidad a través de una aplicación autenticadora.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">2.4 Responsabilidad de la Cuenta</h3>
                <p className="text-gray-700 leading-relaxed">
                  Eres responsable de mantener la confidencialidad de tu contraseña y credenciales 2FA. Eres completamente responsable de cualquier actividad que ocurra bajo tu cuenta. Debes notificarnos inmediatamente de cualquier acceso no autorizado.
                </p>
              </div>
            </div>
          </section>

          {/* Products and Licenses */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">3. Productos y Licencias</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3.1 Autenticidad</h3>
                <p className="text-gray-700 leading-relaxed">
                  Garantizamos que todas las licencias de software que vendemos son 100% originales y legítimas. Cada licencia incluye las claves de activación necesarias y documentación legal.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3.2 Descripción de Productos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Nos esforzamos por proporcionar descripciones precisas de todos nuestros productos. Sin embargo, no garantizamos que todas las descripciones, precios o disponibilidad de productos sean precisas, completas o libres de errores.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3.3 Disponibilidad</h3>
                <p className="text-gray-700 leading-relaxed">
                  Los productos están disponibles mientras el inventario lo permita. Nos reservamos el derecho de limitar o rechazar pedidos, especialmente en casos de fraude sospechoso.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">3.4 Garantía de Productos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Todos nuestros productos incluyen garantía de satisfacción. Si tienes problemas con tu licencia, ofrecemos soporte técnico completo y soluciones de reemplazo.
                </p>
              </div>
            </div>
          </section>

          {/* Payment and Transactions */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">4. Pagos y Transacciones</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.1 Métodos de Pago</h3>
                <p className="text-gray-700 leading-relaxed">
                  Aceptamos múltiples formas de pago a través de <strong>PayU Latam</strong>, nuestra pasarela de pago segura y confiable. Los pagos se procesan de forma segura y encriptada.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.2 Procesamiento de Pagos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Al realizar una compra, autorizas a Mercador y a PayU Latam a procesar el pago usando la información de pago que proporcionas. El pago se procesará en tu moneda local o en COP (Pesos Colombianos).
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.3 Facturación</h3>
                <p className="text-gray-700 leading-relaxed">
                  Recibirás un recibo de la transacción después de realizar el pago. Este recibo incluye todos los detalles de tu compra y puede utilizarse para solicitar reembolsos o presentar reclamaciones.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">4.4 Impuestos</h3>
                <p className="text-gray-700 leading-relaxed">
                  Los precios mostrados incluyen los impuestos aplicables según la legislación colombiana. Mercador es responsable de remitir los impuestos correspondientes a las autoridades competentes.
                </p>
              </div>
            </div>
          </section>

          {/* Returns and Refunds */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">5. Devoluciones y Reembolsos</h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5.1 Política de Devolución</h3>
                <p className="text-gray-700 leading-relaxed">
                  Ofrecemos devoluciones dentro de 14 días después de la compra si:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mt-2 ml-2">
                  <li>La licencia no funciona correctamente</li>
                  <li>No recibiste el código de activación</li>
                  <li>El producto no coincide con la descripción</li>
                  <li>Solicitaste el reembolso dentro del plazo establecido</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5.2 Proceso de Reembolso</h3>
                <p className="text-gray-700 leading-relaxed">
                  Los reembolsos se procesarán a través de PayU Latam en 5-10 días hábiles después de aprobar tu solicitud de devolución. El dinero se acreditará en el mismo método de pago utilizado.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">5.3 Exclusiones</h3>
                <p className="text-gray-700 leading-relaxed">
                  No se aceptan devoluciones si la licencia ya fue utilizada completamente o si se ha vencido el período de 14 días. Tampoco se aceptan cambios de opinión después de usar la licencia.
                </p>
              </div>
            </div>
          </section>

          {/* Limitations of Liability */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">6. Limitaciones de Responsabilidad</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                En la máxima medida permitida por la ley, Mercador no será responsable por:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Daños indirectos, incidentales, especiales o consecuentes</li>
                <li>Pérdida de datos, ganancias o ingresos</li>
                <li>Pérdida de acceso a los Servicios</li>
                <li>Problemas de compatibilidad de software con sistemas específicos</li>
              </ul>
            </div>
          </section>

          {/* User Conduct */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">7. Conducta del Usuario</h2>
            <p className="text-gray-700 leading-relaxed mb-3">
              Al usar Mercador, aceptas que no:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Realizarás ninguna actividad fraudulenta o ilegal</li>
              <li>Intentarás acceder a cuentas de otros usuarios</li>
              <li>Compartirás licencias con terceros de forma ilegal</li>
              <li>Intentarás eludir nuestros sistemas de seguridad</li>
              <li>Usarás software para atacar o deshabilitar nuestros servicios</li>
              <li>Realizarás múltiples compras con intención de devolverlas fraudulentamente</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">8. Propiedad Intelectual</h2>
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">
                Todos los derechos de propiedad intelectual de las licencias de software pertenecen a sus respectivos desarrolladores y titulares de derechos. Mercador es solo un distribuidor autorizado.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Al comprar una licencia, obtienes una licencia limitada, no exclusiva e intransferible para usar el software de acuerdo con los términos del desarrollador.
              </p>
            </div>
          </section>

          {/* Modifications to Terms */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">9. Modificaciones a los Términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos en cualquier momento. Las modificaciones serán efectivas cuando se publiquen en el sitio web. Tu uso continuado de los Servicios después de las modificaciones constituye aceptación de los nuevos Términos.
            </p>
          </section>

          {/* Termination */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">10. Terminación</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos terminar o suspender tu cuenta inmediatamente, sin aviso previo, por violación de estos Términos, actividad fraudulenta o por cualquier razón que consideremos necesaria para proteger nuestros Servicios.
            </p>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">11. Contacto</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Si tienes preguntas sobre estos Términos y Condiciones, no dudes en contactarnos:
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p className="text-gray-700">contacto@mercador.com</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Teléfono</p>
                <p className="text-gray-700">+57 312 567 890</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Ubicación</p>
                <p className="text-gray-700">Armenia, Quindío, Colombia</p>
              </div>
            </div>
          </section>

          {/* Governing Law */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">12. Ley Aplicable</h2>
            <p className="text-gray-700 leading-relaxed">
              Estos Términos y Condiciones se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta conforme a la jurisdicción de los juzgados de Armenia, Quindío.
            </p>
          </section>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Tienes preguntas?
            </h3>
            <p className="text-gray-700 mb-6">
              Estamos aquí para ayudarte. Contáctanos en cualquier momento.
            </p>
            <a
              href="mailto:contacto@mercador.com"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enviar Email
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
