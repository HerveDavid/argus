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
import { useZmqUrl } from '@/features/settings/components/zmq/hooks/use-zmq-url';
import { useEffect, useState } from 'react';

/**
 * Validation schema for the ZMQ URL configuration form
 */
const zmqUrlFormSchema = z.object({
  url: z
    .string()
    .url({
      message: 'Please enter a valid URL',
    })
    .or(z.string().length(0)),
  subscription: z.string().optional(),
});

type ZmqUrlFormValues = z.infer<typeof zmqUrlFormSchema>;

/**
 * Form field configuration for rendering
 */
const FORM_FIELDS = [
  {
    name: 'url' as const,
    label: 'ZMQ URL',
    placeholder: 'tcp://127.0.0.1:5555',
    description: 'Enter the URL of the ZMQ server including protocol and port.',
    type: 'text',
  },
  {
    name: 'subscription' as const,
    label: 'Subscription Topic',
    placeholder: 'topic',
    description:
      'Enter the subscription topic (leave empty to subscribe to all messages).',
    type: 'text',
  },
];

const ZmqUrlSettings = () => {
  const {
    url,
    subscription,
    status,
    loading,
    error,
    setZmqConfig,
    refreshZmqUrl,
  } = useZmqUrl();

  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ZmqUrlFormValues>({
    resolver: zodResolver(zmqUrlFormSchema),
    defaultValues: {
      url: url || '',
      subscription: subscription || '',
    },
  });

  // Update form when the URL and subscription are loaded or changed
  useEffect(() => {
    if (url !== undefined) {
      form.setValue('url', url);
    }
    if (subscription !== undefined) {
      form.setValue('subscription', subscription);
    }
  }, [url, subscription, form]);

  async function handleSubmit(data: ZmqUrlFormValues) {
    setFormError(null);
    setIsSubmitting(true);

    try {
      // Use the combined function to update both URL and subscription
      await setZmqConfig(data.url, data.subscription || '');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    refreshZmqUrl();
    form.reset({
      url: url || '',
      subscription: subscription || '',
    });
    setFormError(null);
  }

  return (
    <div className="space-y-8 w-full max-w-full p-4">
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          ZMQ Settings
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          Configure the ZeroMQ connection settings for real-time messaging.
        </p>
      </div>

      {(error || formError) && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error || formError}
        </div>
      )}

      {/* Responsive grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="w-full">
          <Card className="shadow-xs overflow-hidden bg-card">
            <CardHeader className="bg-muted border-b border-border pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Current Configuration
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Your active ZMQ connection settings
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
                    <TableRow className="border-b border-border">
                      <TableCell className="font-semibold text-foreground py-4 pl-6">
                        Subscription
                      </TableCell>
                      <TableCell className="text-foreground font-mono text-sm py-4 pr-6">
                        {subscription ? (
                          subscription
                        ) : (
                          <span className="text-muted-foreground italic">
                            All messages
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-semibold text-foreground py-4 pl-6">
                        Status
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        {loading || isSubmitting ? (
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
          <Card className="shadow-xs bg-card">
            <CardHeader className="bg-muted border-b border-border pb-4">
              <CardTitle className="text-md font-bold text-card-foreground">
                Update Settings
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground mt-1">
                Modify your ZMQ connection configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form
                  id="zmq-url-form"
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
                              disabled={loading || isSubmitting}
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
                      disabled={loading || isSubmitting}
                    >
                      Reset
                    </Button>
                    <Button
                      type="submit"
                      className="text-sm font-medium py-2 px-6"
                      disabled={loading || isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Settings'}
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

export default ZmqUrlSettings;
