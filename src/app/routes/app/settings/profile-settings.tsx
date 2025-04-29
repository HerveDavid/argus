import {
  ThemeColor,
  ThemeMode,
  useTheme,
} from '@/features/settings/components/theme/provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SunIcon, MoonIcon, LaptopIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Effect } from 'effect';
import { getStoreFilePath } from '@/features/settings/services/store-service';
import { Badge } from '@/components/ui/badge';

const ProfileSettings = () => {
  // Mock data for application information
  const appVersion = 'v1.2.3';
  const [storagePath, setStoragePath] = useState('');
  const { themeMode, themeColor, setThemeMode, setThemeColor } = useTheme();

  // Theme options with icons and labels
  const themeOptions = [
    { value: 'light', label: 'Light', icon: <SunIcon size={16} /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon size={16} /> },
    { value: 'system', label: 'System', icon: <LaptopIcon size={16} /> },
  ];

  // Color theme options
  const colorOptions = [
    { value: 'default', label: 'Default', color: 'bg-primary' },
    { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
    { value: 'nord', label: 'Nord', color: 'bg-cyan-700' },
    { value: 'gruvbox', label: 'Gruvbox', color: 'bg-amber-700' },
  ];

  useEffect(() => {
    Effect.runPromise(getStoreFilePath()).then(setStoragePath);
  }, []);

  // Handler for theme mode selection
  const handleThemeModeSelect = (value: ThemeMode) => {
    setThemeMode(value);
  };

  // Handler for color theme selection
  const handleColorThemeSelect = (value: ThemeColor) => {
    setThemeColor(value);
  };

  return (
    <div className="space-y-8 w-full max-w-full p-4">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Profile Settings
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Manage your application preferences and view system information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Theme Settings Card */}
        <Card className="shadow-xs bg-card">
          <CardHeader className="bg-muted border-b pb-4">
            <CardTitle className="text-md font-bold text-card-foreground">
              Appearance
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Theme Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {themeOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative flex items-center justify-center p-3 rounded-md cursor-pointer ${
                        themeMode === option.value
                          ? 'bg-muted ring-2 ring-primary'
                          : 'bg-card hover:bg-muted/50'
                      }`}
                      onClick={() =>
                        handleThemeModeSelect(option.value as ThemeMode)
                      }
                    >
                      <div className="flex flex-col items-center gap-2">
                        {option.icon}
                        <span className="text-sm">{option.label}</span>
                      </div>
                      {themeMode === option.value && (
                        <Badge className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground">
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose between light, dark, or system theme
                </p>
              </div>

              {/* Color Theme Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Color Theme
                </label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {colorOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-md cursor-pointer ${
                        themeColor === option.value
                          ? 'bg-muted ring-2 ring-primary'
                          : 'bg-card hover:bg-muted/50'
                      }`}
                      onClick={() =>
                        handleColorThemeSelect(option.value as ThemeColor)
                      }
                    >
                      <div className={`w-6 h-6 rounded-full ${option.color}`} />
                      <span className="text-xs">{option.label}</span>
                      {themeColor === option.value && (
                        <Badge className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground">
                          Active
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a color palette for the application
                </p>
              </div>

              {/* Preview */}
              <div className="pt-4">
                <label className="text-sm font-medium text-foreground block mb-2">
                  Preview
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-primary text-primary-foreground rounded-md">
                    Primary
                  </div>
                  <div className="p-3 bg-secondary text-secondary-foreground rounded-md">
                    Secondary
                  </div>
                  <div className="p-3 bg-accent text-accent-foreground rounded-md">
                    Accent
                  </div>
                  <div className="p-3 bg-muted text-muted-foreground rounded-md">
                    Muted
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card className="shadow-xs bg-card">
          <CardHeader className="bg-muted border-b pb-4">
            <CardTitle className="text-md font-bold text-card-foreground">
              System Information
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              Details about your application installation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                <TableRow className="border-b">
                  <TableCell className="font-semibold text-foreground w-1/3 py-4 pl-6">
                    Version
                  </TableCell>
                  <TableCell className="text-foreground font-mono text-sm py-4 pr-6">
                    {appVersion}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-semibold text-foreground py-4 pl-6">
                    Settings Path
                  </TableCell>
                  <TableCell className="text-foreground font-mono text-sm py-4 pr-6 break-all">
                    {storagePath}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileSettings;
