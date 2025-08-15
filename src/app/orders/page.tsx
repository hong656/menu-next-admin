import ProtectedRoute from '@/components/auth/protected-route';

export default function MenuItems() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        yo bro
      </div>
    </ProtectedRoute>
  );
}
