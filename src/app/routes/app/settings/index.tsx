import EditorLayout from '@/components/layouts/editor';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import ProfileSettings from './profile-settings';
import {
  ArrowLeft,
  User,
  Bell,
  Link2,
  ChevronRight,
  Settings as SettingsIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ZmqUrlSettings from './zmq-connection-settings';

const TABS = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <User size={18} />,
    description: 'Manage your personal settings and preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell size={18} />,
    badge: '4',
    description: 'Configure how and when you receive notifications',
  },
  {
    id: 'zmq',
    label: 'Zmq',
    icon: <Link2 size={18} />,
    description: 'Manage server and API connections',
  },
];

const HomeSettings = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <EditorLayout>
      <div className="w-full h-screen flex flex-col bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  to={paths.home.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Button variant="ghost" size="icon" aria-label="Back to home">
                    <ArrowLeft size={18} />
                  </Button>
                </Link>
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
                  {activeTab == 'zmq' && <ZmqUrlSettings />}
                  {activeTab === 'profile' && <ProfileSettings />}
                  {activeTab === 'notifications' && (
                    <div className="p-4 rounded-lg border border-border bg-card shadow-sm">
                      <p className="text-muted-foreground text-center py-12">
                        Notifications settings will be implemented soon
                      </p>
                    </div>
                  )}
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
