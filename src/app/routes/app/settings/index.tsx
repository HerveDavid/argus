import EditorLayout from '@/components/layouts/editor';
import { Button } from '@/components/ui/button';
import { ProxyForm } from '@/features/settings/proxy/components/proxy-form';
import { useProxyStore } from '@/features/settings/proxy/stores/proxy.store';

const HomeSettings = () => {
  const { resetProxy } = useProxyStore();
  return (
    <EditorLayout>
      <div className="p-6">
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
    </EditorLayout>
  );
};

export default HomeSettings;
