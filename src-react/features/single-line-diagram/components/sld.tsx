import React from 'react';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export interface SingleLineDiagram {
  id: string;
}

export const Sld: React.FC<SingleLineDiagram> = ({ id }) => {
  return (
    <div className="h-full">
      <Card className="h-full flex flex-col border-0">
        <CardHeader>
          <CardTitle>
            <h1>{id}</h1>
          </CardTitle>
          <CardDescription>Card Description</CardDescription>
          <CardAction>Card Action</CardAction>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto">
          <p>Card Content</p>
        </CardContent>

        <CardFooter>
          <p>Card Footer</p>
        </CardFooter>
      </Card>
    </div>
  );
};
