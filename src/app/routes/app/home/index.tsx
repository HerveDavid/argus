import EditorLayout from '@/components/layouts/editor';
import SingleLineDiagram from '@/features/diagram/components/single-line-diagram';
import React from 'react';

const HomeRoute: React.FC = () => {
  return (
    <EditorLayout>
      <SingleLineDiagram />
    </EditorLayout>
  );
};

export default HomeRoute;
