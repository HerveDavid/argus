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

/**
 * Proxy configuration form component
 */
export function ProxyForm() {
  const { proxy, setProxy, applyProxy } = useProxyStore();

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
    <Form {...form}>
      <form
        id="proxy-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-2"
      >
        {FORM_FIELDS.map((field) => (
          <FormField
            key={field.name}
            control={form.control}
            name={field.name}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...formField}
                  />
                </FormControl>
                <FormDescription>{field.description}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </form>
    </Form>
  );
}

/**
 * Container component for the proxy form with actions
 */
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

/**
 * Current settings display for a proxy configuration field
 */
interface ProxySettingProps {
  label: string;
  value: string | undefined;
  isPassword?: boolean;
}

function ProxySetting({ label, value, isPassword = false }: ProxySettingProps) {
  const displayValue = !value ? 'Not set' : isPassword ? '••••••••' : value;

  return (
    <>
      <div className="text-sm font-semibold">{label}:</div>
      <div className="text-sm">{displayValue}</div>
    </>
  );
}

/**
 * Complete proxy management component with current settings and form
 */
export function ProxyManager() {
  const { proxy, resetProxy } = useProxyStore();

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Proxy Management</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="text-lg font-medium mb-2">Current Settings</h3>
        <div className="grid grid-cols-2 gap-2">
          <ProxySetting label="URL" value={proxy.url} />
          <ProxySetting label="Username" value={proxy.username} />
          <ProxySetting label="Password" value={proxy.password} isPassword />
          <ProxySetting label="No Proxy" value={proxy.no_proxy} />
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
