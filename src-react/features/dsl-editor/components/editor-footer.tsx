export const Footer = ({ filepath }: { filepath: String }) => {
  return (
    <footer className="bg-background flex h-5 items-center border-t">
      <p className="text-muted-foreground mx-2 text-xs">{filepath}</p>
    </footer>
  );
};