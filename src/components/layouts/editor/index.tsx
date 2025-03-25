import { TopMenuBar } from './top-menu-bar';

type LayoutProps = {
  children: React.ReactNode;
};

export const EditorLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col h-screen w-full">
      <TopMenuBar />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

export default EditorLayout;
