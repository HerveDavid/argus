import EditorLayout from '@/components/layouts/editor';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';

import ProfileSettings from './profile-settings';
import ConfigurationSettings from './configuration-settings';

import {
  ArrowLeft,
  User,
  ChevronRight,
  Settings as SettingsIcon,
  FileCode,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={18} />,
    description: 'Manage your personal settings and preferences',
  },
  {
    id: 'config',
    label: 'Configuration',
    icon: <FileCode size={18} />,
    description: 'Manage simulation settings',
  },
];

const HomeSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <EditorLayout>
      <div className="w-full h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Back to previous page"
                  onClick={handleGoBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft size={18} />
                </Button>
                <div className="flex items-center gap-2">
                  <SettingsIcon size={20} className="text-primary" />
                  <h1 className="text-xl font-semibold tracking-tight">
                    Settings
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Takes all available space */}
        <div className="flex-1">
          <div className="h-full sm:px-6 lg:px-8">
            <div className="h-full lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
              {/* Sidebar */}
              <div className="hidden lg:block pt-4">
                <div className="space-y-1">
                  {TABS.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                      className={`w-full justify-start gap-3 px-3 font-medium ${
                        activeTab === tab.id
                          ? 'bg-secondary text-secondary-foreground'
                          : ''
                      }`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="flex items-center gap-2">
                        {tab.icon}
                        <span>{tab.label}</span>
                      </span>
                      <div className="ml-auto flex items-center">
                        {tab.badge && (
                          <Badge variant="secondary">{tab.badge}</Badge>
                        )}
                        <ChevronRight
                          size={16}
                          className={`ml-2 text-muted-foreground transition-transform ${
                            activeTab === tab.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </Button>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-xs text-muted-foreground px-3">
                    Customize your experience with personalized settings and
                    options
                  </p>
                </div>
              </div>

              {/* Tabs for mobile */}
              <div className="mb-6 lg:hidden">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-flow-col overflow-x-auto justify-start gap-2 p-1">
                    {TABS.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="px-3 py-2 flex items-center gap-2 whitespace-nowrap"
                      >
                        {tab.icon}
                        {tab.label}
                        {tab.badge && (
                          <Badge variant="secondary" className="ml-1">
                            {tab.badge}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                <Separator className="mt-4" />
              </div>

              {/* Content */}
              <div className="lg:border-l lg:border-border lg:pl-8 h-full pt-4">
                {/* Tab heading (desktop only) */}
                <div className="mb-6 hidden lg:block">
                  <h2 className="text-xl font-semibold text-foreground">
                    {TABS.find((tab) => tab.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {TABS.find((tab) => tab.id === activeTab)?.description}
                  </p>
                  <Separator className="mt-4" />
                </div>

                <div className="mt-4 w-full h-full">
                  {activeTab === 'profile' && <ProfileSettings />}
                  {activeTab === 'config' && <ConfigurationSettings />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default HomeSettings;
