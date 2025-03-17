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
import { useProxyStore } from '../../stores/proxy.store';
import { Proxy } from '../../types/proxy.type';

// Define the form validation schema with optional username and password
const proxyFormSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  noProxy: z.string().optional().default(''),
  url: z.string().url({
    message: 'Please enter a valid URL',
  }),
});

type ProxyFormValues = z.infer<typeof proxyFormSchema>;

export function ProxyForm() {
  // Get proxy data and actions from Zustand store
  const { proxy, setProxy } = useProxyStore();

  // Initialize the form with react-hook-form
  const form = useForm<ProxyFormValues>({
    resolver: zodResolver(proxyFormSchema),
    defaultValues: proxy, // Use values from the store as default values
  });

  // Handler for form submission
  function handleSubmit(data: ProxyFormValues) {
    setProxy(data as Proxy);
    console.log('Proxy settings saved to Zustand store:', data);
  }

  return (
    <Form {...form}>
      <form
        id="proxy-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proxy URL</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://proxy.example.com:8080"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the URL of the proxy server including port if required.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                Leave blank if proxy doesn't require authentication.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter password"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Leave blank if proxy doesn't require authentication.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="noProxy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>No Proxy</FormLabel>
              <FormControl>
                <Input
                  placeholder="localhost,127.0.0.1,.internal.domain"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Comma-separated list of hosts that should bypass the proxy.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function ProxyFormContainer() {
  const { resetProxy } = useProxyStore();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Proxy Configuration</h2>
      <ProxyForm />
      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={resetProxy}>
          Reset Proxy Settings
        </Button>
        <Button type="submit" form="proxy-form">
          Save Proxy Settings
        </Button>
      </div>
    </div>
  );
}

export function ProxyManager() {
  const { proxy, resetProxy } = useProxyStore();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Proxy Management</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium mb-2">Current Settings</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm font-semibold">URL:</div>
          <div className="text-sm">{proxy.url || 'Not set'}</div>

          <div className="text-sm font-semibold">Username:</div>
          <div className="text-sm">{proxy.username || 'Not set'}</div>

          <div className="text-sm font-semibold">Password:</div>
          <div className="text-sm">
            {proxy.password ? '••••••••' : 'Not set'}
          </div>

          <div className="text-sm font-semibold">No Proxy:</div>
          <div className="text-sm">{proxy.noProxy || 'Not set'}</div>
        </div>
      </div>

      <ProxyForm />

      <div className="mt-4 flex justify-between">
        <Button variant="outline" onClick={resetProxy}>
          Reset Proxy Settings
        </Button>
        <Button type="submit" form="proxy-form">
          Save Proxy Settings
        </Button>
      </div>
    </div>
  );
}
