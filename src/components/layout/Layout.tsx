import Sidebar from './Sidebar';
import { CompactStoreSelector } from '@/components/StoreSelector';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex h-screen bg-background">
      <div className="w-64 flex-shrink-0">
        <Sidebar />
      </div>
      <main className="flex-1 overflow-auto">
        {/* Header with Store Selector */}
        <div className="border-b bg-white px-6 py-3">
          <div className="flex items-center justify-end">
            <CompactStoreSelector />
          </div>
        </div>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;