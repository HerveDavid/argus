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
import { useProxyStore } from '@/features/settings/components/proxy/stores/proxy.store';
import { Proxy } from '@/features/settings/components/proxy/types/proxy.type';

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
    defaultValues: proxy,
    // Note: No hardcoded zodResolver which was imported from @hookform/resolvers/zod
    // You'll need to add it back if required, or handle validation differently
  });

  function handleSubmit(data: ProxyFormValues) {
    setProxy(data as Proxy);
    applyProxy();
  }

  return (
    <div className="w-full max-w-full p-2 sm:p-4 mx-auto space-y-6 sm:space-y-8">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Proxy Settings
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Configure your network proxy settings for connecting to external
          services.
        </p>
      </div>

      {/* Responsive grid with breakpoints for different screen sizes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Current Configuration Card */}
        <div className="w-full">
          <Card className="shadow-md border overflow-hidden bg-card">
            <CardHeader className="bg-muted border-b p-4 sm:pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Current Configuration
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
                Your active proxy settings currently applied
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold text-foreground w-1/3 py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        URL
                      </TableCell>
                      <TableCell className="text-foreground font-mono text-xs sm:text-sm py-3 sm:py-4 pr-4 sm:pr-6">
                        {proxy.url || (
                          <span className="text-muted-foreground italic">
                            Not set
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold text-foreground py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        Username
                      </TableCell>
                      <TableCell className="text-foreground py-3 sm:py-4 pr-4 sm:pr-6 text-sm">
                        {proxy.username || (
                          <span className="text-muted-foreground italic">
                            Not set
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-b">
                      <TableCell className="font-semibold text-foreground py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        Password
                      </TableCell>
                      <TableCell className="text-foreground py-3 sm:py-4 pr-4 sm:pr-6 text-sm">
                        {proxy.password ? (
                          '••••••••'
                        ) : (
                          <span className="text-muted-foreground italic">
                            Not set
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-foreground py-3 sm:py-4 pl-4 sm:pl-6 text-sm">
                        No Proxy
                      </TableCell>
                      <TableCell className="text-foreground font-mono text-xs sm:text-sm py-3 sm:py-4 pr-4 sm:pr-6 break-all">
                        {proxy.no_proxy || (
                          <span className="text-muted-foreground italic">
                            Not set
                          </span>
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
          <Card className="shadow-md border bg-card">
            <CardHeader className="bg-muted border-b p-4 sm:pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Update Settings
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground mt-1">
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
                          <FormLabel className="text-xs sm:text-sm font-bold text-foreground block">
                            {field.label}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full font-mono text-xs sm:text-sm p-2 sm:p-3 border border-input rounded-md"
                              {...formField}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-muted-foreground">
                            {field.description}
                          </FormDescription>
                          <FormMessage className="text-xs font-medium text-destructive" />
                        </FormItem>
                      )}
                    />
                  ))}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 sm:pt-6 mt-3 sm:mt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetProxy}
                      className="text-xs sm:text-sm font-medium border-input text-foreground hover:bg-accent py-2 px-3 sm:px-4"
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
