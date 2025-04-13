import { useTheme } from '@/features/settings/components/theme/provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SunIcon, MoonIcon, LaptopIcon } from 'lucide-react';

const ProfileSettings = () => {
  // Mock data for application information
  const appVersion = 'v1.2.3';
  const storagePath = '/Users/current/AppData/Roaming/YourAppName';

  const { theme, setThemeMode } = useTheme();

  // Theme options with icons and labels
  const themeOptions = [
    { value: 'light', label: 'Light', icon: <SunIcon size={16} /> },
    { value: 'dark', label: 'Dark', icon: <MoonIcon size={16} /> },
    { value: 'system', label: 'System', icon: <LaptopIcon size={16} /> },
  ];

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
        <Card className="shadow-md border bg-card">
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
              <div className="space-y-2">
                <label
                  htmlFor="theme-select"
                  className="text-sm font-medium text-foreground block"
                >
                  Theme
                </label>
                <Select value={theme} onValueChange={setThemeMode}>
                  <SelectTrigger id="theme-select" className="w-full">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          {option.icon}
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose between light, dark, or system theme
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information Card */}
        <Card className="shadow-md overflow-hidden bg-card">
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
                    Storage Path
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
