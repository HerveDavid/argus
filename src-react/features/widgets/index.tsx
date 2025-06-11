const Widgets = () => {
  return (
    <div className="space-y-2 text-sm">
      <div className="font-medium">Components</div>
      <div className="ml-2 space-y-1">
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          App
        </div>
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          Header
        </div>
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          Sidebar
        </div>
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          Footer
        </div>
      </div>
      <div className="font-medium mt-3">Functions</div>
      <div className="ml-2 space-y-1">
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          handleClick()
        </div>
        <div className="py-1 hover:bg-sidebar-accent rounded px-2 cursor-pointer">
          useEffect()
        </div>
      </div>
    </div>
  );
};

export default Widgets;
