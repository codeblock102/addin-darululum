
import { DashboardLayout } from "@/components/layouts/DashboardLayout";

const Preferences = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">User Preferences</h1>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">
            Preferences page content will go here.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Preferences;
