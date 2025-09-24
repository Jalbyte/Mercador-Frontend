import { redirect } from 'next/navigation';

export default function PerfilPage() {
  redirect('/profile');
  return null;
}
