import EditorLayout from '@/components/layouts/editor';
import { useState } from 'react';
import ProxySettings from './proxy-settings';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import ServerUrlSettings from './server-url-settings';

const HomeSettings = () => {
  const [activeTab, setActiveTab] = useState('billing');

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications', badge: '4' },
    { id: 'connections', label: 'Connections' },
    { id: 'proxy', label: 'Proxy' },
  ];

  return (
    <EditorLayout>
      <div className="w-full min-h-screen">
        <div className="max-w-full px-4 sm:px-6 lg:px-8">
          <div className="mb-6 pt-6">
            <Link to={paths.home.path}>
              <button className="flex items-center text-sm text-gray-600 mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Back to home
              </button>
            </Link>
            <h2 className="text-2xl font-bold">Settings</h2>
          </div>

          <div className="border-b">
            <div className="flex overflow-x-auto space-x-6 -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`py-2 px-1 relative whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-b-2 border-b-alarm-info font-medium'
                      : 'text-gray-500'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="ml-1 px-1.5 text-xs rounded-full bg-gray-200">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 pb-12 w-full">
            <div className="max-w-5xl mx-auto">
              {activeTab === 'connections' && <ServerUrlSettings />}
              {activeTab === 'proxy' && <ProxySettings />}
              {/* Add other tab content here when needed */}
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeSettings;
