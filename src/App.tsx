import { RouterProvider, useRouter } from '@/lib/router';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ToastContainer } from '@/components/Toast';
import { DashboardPage } from '@/pages/DashboardPage';
import { ApplyPage } from '@/pages/ApplyPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { ModelInfoPage } from '@/pages/ModelInfoPage';

function AppContent() {
  const { page } = useRouter();

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar />
      <div className="md:pl-72">
        <Header />
        <main className="px-5 py-6 md:px-8 md:py-8">
          {page === 'dashboard' && <DashboardPage />}
          {page === 'apply' && <ApplyPage />}
          {page === 'history' && <HistoryPage />}
          {page === 'model' && <ModelInfoPage />}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AppContent />
    </RouterProvider>
  );
}

export default App;
