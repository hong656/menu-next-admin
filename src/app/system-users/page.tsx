import ProtectedRoute from '@/components/auth/protected-route';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <h1>Hello world</h1>
      </div>
    </ProtectedRoute>
  );
}
