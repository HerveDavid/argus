import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useProxyStore } from '@/features/settings/proxy/stores/proxy.store';
import { Proxy } from '@/features/settings/proxy/types/proxy.type';
// Note: Pour que les scrollbars personnalisées fonctionnent,
// vous devrez installer tailwind-scrollbar ou une librairie similaire

/**
 * Validation schema for the proxy configuration form
 */
const proxyFormSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  no_proxy: z.string().optional().default(''),
  url: z.string().url({
    message: 'Please enter a valid URL',
  }),
});

type ProxyFormValues = z.infer<typeof proxyFormSchema>;

/**
 * Form field configuration for rendering
 */
const FORM_FIELDS = [
  {
    name: 'url' as const,
    label: 'Proxy URL',
    placeholder: 'https://proxy.example.com:8080',
    description:
      'Enter the URL of the proxy server including port if required.',
    type: 'text',
  },
  {
    name: 'username' as const,
    label: 'Username (Optional)',
    placeholder: 'Enter username',
    description: "Leave blank if proxy doesn't require authentication.",
    type: 'text',
  },
  {
    name: 'password' as const,
    label: 'Password (Optional)',
    placeholder: 'Enter password',
    description: "Leave blank if proxy doesn't require authentication.",
    type: 'password',
  },
  {
    name: 'no_proxy' as const,
    label: 'No Proxy',
    placeholder: 'localhost,127.0.0.1,.internal.domain',
    description: 'Comma-separated list of hosts that should bypass the proxy.',
    type: 'text',
  },
];

const ProxySettings = () => {
  const { proxy, setProxy, applyProxy, resetProxy } = useProxyStore();

  const form = useForm<ProxyFormValues>({
    resolver: zodResolver(proxyFormSchema),
    defaultValues: proxy,
  });

  function handleSubmit(data: ProxyFormValues) {
    setProxy(data as Proxy);
    applyProxy();
    console.log('Proxy settings saved to Zustand store and AppState:', data);
  }

  return (
    <div className="w-full max-w-full p-2 sm:p-4 mx-auto space-y-6 sm:space-y-8 overflow-auto max-h-screen">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-2">
          Proxy Settings
        </h2>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Configure your network proxy settings for connecting to external
          services.
        </p>
      </div>

      {/* Responsive grid with breakpoints for different screen sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Current Configuration Card */}
        <div className="w-full">
          <Card className="shadow-md border border-gray-200 overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:pb-4">
              <CardTitle className="text-md font-bold text-gray-800">
                Current Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                Your active proxy settings currently applied
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-80 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                <Table>
                  <TableBody>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 w-1/3 py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        URL
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-xs sm:text-sm py-3 sm:py-4 pr-4 sm:pr-6">
                        {proxy.url || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        Username
                      </TableCell>
                      <TableCell className="text-gray-700 py-3 sm:py-4 pr-4 sm:pr-6 text-sm">
                        {proxy.username || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        Password
                      </TableCell>
                      <TableCell className="text-gray-700 py-3 sm:py-4 pr-4 sm:pr-6 text-sm">
                        {proxy.password ? (
                          '••••••••'
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-gray-800 py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        No Proxy
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-xs sm:text-sm py-3 sm:py-4 pr-4 sm:pr-6 break-all">
                        {proxy.no_proxy || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Update Settings Card */}
        <div className="w-full">
          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="bg-gray-50 border-b border-gray-200 p-4 sm:pb-4">
              <CardTitle className="text-md font-bold text-gray-800">
                Update Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-600 mt-1">
                Modify your proxy configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:pt-6">
              <Form {...form}>
                <form
                  id="proxy-form"
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4 sm:space-y-5"
                >
                  {FORM_FIELDS.map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem className="space-y-1 sm:space-y-2">
                          <FormLabel className="text-xs sm:text-sm font-bold text-gray-700 block">
                            {field.label}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full font-mono text-xs sm:text-sm p-2 sm:p-3 border border-gray-300 rounded-md"
                              {...formField}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            {field.description}
                          </FormDescription>
                          <FormMessage className="text-xs font-medium text-red-500" />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6 mt-3 sm:mt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetProxy}
                      className="text-xs sm:text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-3 sm:px-4"
                    >
                      Reset Settings
                    </Button>
                    <Button
                      type="submit"
                      className="text-xs sm:text-sm font-medium py-2 px-4 sm:px-6"
                    >
                      Save Settings
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProxySettings;
