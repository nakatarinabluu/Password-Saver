import { notFound } from 'next/navigation';

export default function Home() {
  // Invisible Presence: The root route / must return a standard 404 Not Found.
  notFound();
}
