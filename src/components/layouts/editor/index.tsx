import { TopMenuBar } from "@/features/top-menu-bar";

type LayoutProps = {
  children: React.ReactNode;
};

export const EditorLayout = ({ children }: LayoutProps) => {
  return (
    <div className="flex flex-col fixed inset-0 bg-gray-900 text-gray-200 overflow-hidden">
      <TopMenuBar />
      {children}
    </div>
  );
};
