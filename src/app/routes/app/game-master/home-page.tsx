import { EditorLayout } from '@/components/layouts/editor';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';
import { ProjectSettings } from '@/features/projects/components/project-settings';
import { useProjectsStore } from '@/features/projects/stores/use-projects-store';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const HomePage = () => {
  const { currentProject, loadStoredProject } = useProjectsStore();

  useEffect(() => {
    loadStoredProject();
  }, []);

  return (
    <EditorLayout>
      <Tabs defaultValue="mapping" className="flex-1 p-2">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mapping">Mapping</TabsTrigger>
          <TabsTrigger value="scenario">Scenario Editor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="mapping">
          <Card>
            <CardHeader>
              <CardTitle>Mapping</CardTitle>
              <CardDescription>
                Make changes to your account here. Click save when you're done.
              </CardDescription>
            </CardHeader>
            <CardContent></CardContent>
            <CardFooter>
              <Link to={paths.gameMaster.mapping.getHref(currentProject!.name)}>
                <Button>Create mapping</Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="scenario">
          <Card>
            <CardHeader>
              <CardTitle>Scenario</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent></CardContent>
            <CardFooter>
              <Button>Edit scenario</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription></CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectSettings />
            </CardContent>
            <CardFooter></CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </EditorLayout>
  );
};

export default HomePage;
