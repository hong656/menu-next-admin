import ProtectedRoute from '@/components/auth/protected-route';
import AssignPermissionsTable from './role-permission-table';

export default function RolesPage() {
  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <AssignPermissionsTable/>
      </div>
    </ProtectedRoute>
  );
}