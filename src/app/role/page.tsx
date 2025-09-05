import ProtectedRoute from '@/components/auth/protected-route';
import RolesTable from './role-table';

export default function RolesPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <RolesTable/>
      </div>
    </ProtectedRoute>
  );
}