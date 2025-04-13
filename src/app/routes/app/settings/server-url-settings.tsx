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
import { useServerUrl } from '@/features/settings/components/url/hooks/use-server-url';
import { useEffect } from 'react';

/**
 * Validation schema for the server URL configuration form
 */
const serverUrlFormSchema = z.object({
  url: z
    .string()
    .url({
      message: 'Please enter a valid URL',
    })
    .or(z.string().length(0)),
});

type ServerUrlFormValues = z.infer<typeof serverUrlFormSchema>;

/**
 * Form field configuration for rendering
 */
const FORM_FIELDS = [
  {
    name: 'url' as const,
    label: 'Server URL',
    placeholder: 'https://api.example.com',
    description: 'Enter the URL of the API server including port if required.',
    type: 'text',
  },
];

const ServerUrlSettings = () => {
  const { url, status, loading, error, setServerUrl, refreshServerUrl } =
    useServerUrl();

  const form = useForm<ServerUrlFormValues>({
    resolver: zodResolver(serverUrlFormSchema),
    defaultValues: {
      url: url || '',
    },
  });

  // Update form when the URL is loaded or changed
  useEffect(() => {
    if (url !== undefined) {
      form.setValue('url', url);
    }
  }, [url, form]);

  function handleSubmit(data: ServerUrlFormValues) {
    setServerUrl(data.url);
  }

  function handleReset() {
    refreshServerUrl();
    form.reset({ url: url || '' });
  }

  return (
    <div className="space-y-8 w-full max-w-full p-4">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          Server URL Settings
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Configure the API server URL for connecting to backend services.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <Card className="shadow-md border border-border overflow-hidden bg-card">
            <CardHeader className="bg-muted border-b border-border pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Current Configuration
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Your active server URL settings
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableBody>
                    <TableRow className="border-b border-border">
                      <TableCell className="font-semibold text-foreground w-1/3 py-4 pl-6">
                        URL
                      </TableCell>
                      <TableCell className="text-foreground font-mono text-sm py-4 pr-6">
                        {url ? (
                          url
                        ) : (
                          <span className="text-muted-foreground italic">
                            Not set
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-foreground py-4 pl-6">
                        Status
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        {loading ? (
                          <span className="text-primary">Loading...</span>
                        ) : status === 'configured' ? (
                          <span className="text-success">Configured</span>
                        ) : (
                          <span className="text-muted-foreground">
                            Not configured
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

        <div className="w-full">
          <Card className="shadow-md border border-border bg-card">
            <CardHeader className="bg-muted border-b border-border pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Update Settings
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Modify your server URL configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  id="server-url-form"
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
                          <FormLabel className="text-sm font-bold text-foreground block">
                            {field.label}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type={field.type}
                              placeholder={field.placeholder}
                              className="w-full font-mono text-sm p-3 border border-input rounded-md"
                              {...formField}
                              disabled={loading}
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

                  <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 mt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="text-sm font-medium border-input text-foreground hover:bg-accent py-2 px-4"
                      disabled={loading}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="text-sm font-medium py-2 px-6"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Settings'}
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

export default ServerUrlSettings;
