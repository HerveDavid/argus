import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SVGViewer from './drag';

export const GridPreview = () => {
  return (
    <Tabs defaultValue="graph" className="flex-1 m-2">
      <h1 className='mb-2'>Grid</h1>
      <TabsList>
        <TabsTrigger value="graph">Graph</TabsTrigger>
        <TabsTrigger value="structure">Structure</TabsTrigger>
      </TabsList>
      <TabsContent value="graph">
        <SVGViewer></SVGViewer>
      </TabsContent>
      <TabsContent value="structure">Structure</TabsContent>
    </Tabs>
  );
};
