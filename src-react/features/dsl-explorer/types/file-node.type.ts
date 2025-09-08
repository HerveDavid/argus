interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  parent: string;
  children: FileNode[];
}
