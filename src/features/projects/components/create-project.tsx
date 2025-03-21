import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { useProjectsStore } from '../stores/use-projects-store';

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  path: z.string().min(1, 'Path is required'),
});

type FormValues = z.infer<typeof FormSchema>;

export function CreateProject() {
  const [open, setOpen] = useState(false);
  const { addProject } = useProjectsStore();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: '',
      path: '',
    },
  });

  const {
    formState: { isDirty, isValid },
  } = form;

  function onSubmit(data: FormValues) {
    addProject({
      name: data.name,
      path: data.path,
      color: '',
    });
    console.log('Project data:', {
      name: data.name,
      path: data.path,
    });
    setOpen(false);
  }

  const handleSelectFolder = async (field: {
    onChange: (value: string) => void;
  }) => {
    try {
      const selectedPath = await openDialog({
        directory: true,
        multiple: false,
      });

      if (selectedPath) {
        field.onChange(selectedPath);
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button className="px-4 py-1 text-sm">New Project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AlertDialogHeader>
              <AlertDialogTitle>Create a new project</AlertDialogTitle>
              <AlertDialogDescription>
                Fill in the information below to create your project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Write your project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="path"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Path</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Select a folder path"
                          {...field}
                          readOnly
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => handleSelectFolder(field)}
                      >
                        Browse
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <AlertDialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  form.reset();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!isDirty || !isValid}>
                Submit
              </Button>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
