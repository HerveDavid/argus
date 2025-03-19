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
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { useProxyStore } from '@/features/settings/proxy/stores/proxy.store';
import { Proxy } from '@/features/settings/proxy/types/proxy.type';

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
    <div className="space-y-8 w-full max-w-full p-4">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-2">
          Proxy Settings
        </h2>
        <p className="text-base text-gray-600 leading-relaxed">
          Configure your network proxy settings for connecting to external
          services.
        </p>
      </div>

      {/* Truly responsive grid that works on all screen sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <Card className="shadow-md border border-gray-200 overflow-hidden bg-white">
            <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
              <CardTitle className="text-md font-bold text-gray-800">
                Current Configuration
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Your active proxy settings currently applied
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 w-1/3 py-4 pl-6">
                        URL
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-sm py-4 pr-6">
                        {proxy.url || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 py-4 pl-6">
                        Username
                      </TableCell>
                      <TableCell className="text-gray-700 py-4 pr-6">
                        {proxy.username || (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b border-gray-100">
                      <TableCell className="font-semibold text-gray-800 py-4 pl-6">
                        Password
                      </TableCell>
                      <TableCell className="text-gray-700 py-4 pr-6">
                        {proxy.password ? (
                          '••••••••'
                        ) : (
                          <span className="text-gray-400 italic">Not set</span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-gray-800 py-4 pl-6">
                        No Proxy
                      </TableCell>
                      <TableCell className="text-gray-700 font-mono text-sm py-4 pr-6 break-all">
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

        <div className="w-full">
          <Card className="shadow-md border border-gray-200 bg-white">
            <CardHeader className="bg-gray-50 border-b border-gray-200 pb-4">
              <CardTitle className="text-md font-bold text-gray-800">
                Update Settings
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 mt-1">
                Modify your proxy configuration settings
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  id="proxy-form"
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-5"
                >
                  {FORM_FIELDS.map((field) => (
                    <FormField
                      key={field.name}
                      control={form.control}
                      name={field.name}
                      render={({ field: formField }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="text-sm font-bold text-gray-700 block">
                            {field.label}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full font-mono text-sm p-3 border border-gray-300 rounded-md"
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

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetProxy}
                      className="text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 py-2 px-4"
                    >
                      Reset Settings
                    </Button>
                    <Button
                      type="submit"
                      className="text-sm font-medium py-2 px-6"
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
