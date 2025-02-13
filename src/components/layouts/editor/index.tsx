import { TopMenuBar } from '@/features/top-menu-bar';

type LayoutProps = {
  children: React.ReactNode;
};

export const EditorLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen">
      <TopMenuBar />

      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default EditorLayout;
