import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useProjectStore } from '@/features/projects/stores/use-current-project-store';
import { useEffect } from 'react';

const formSchema = z.object({
  gridFile: z.string().refine((file) => file.endsWith('.xiidm'), {
    message: 'Only .xiidm files are allowed',
  }),
  networkFile: z.string().optional(),
});

export function ProjectSettings() {
  const { settings, setSettings, loadSettings } = useProjectStore();

  useEffect(() => {
    const init = async () => {
      await loadSettings();
    };
    init();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gridFile: settings?.gridFile,
      networkFile: settings?.networkFile,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await setSettings({
      gridFile: values.gridFile,
      networkFile: values.networkFile,
    });
  }

  return (
    <div className="m-2">
      <h1>Project Settings</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="gridFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grid file</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept=".xiidm"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        field.onChange(file.name);
                      }
                    }}
                    defaultValue={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="networkFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Network file</FormLabel>
                <FormControl>
                  <Input {...field} disabled placeholder="CIM" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-x-2">
            <Button type="button" variant="outline">
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
