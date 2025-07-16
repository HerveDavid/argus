import React from 'react';

type Id = number | string;

export interface TimelineGroupBase {
  id: Id;
  title: React.ReactNode;
  rightTitle?: React.ReactNode;
  height?: number;
  stackItems?: boolean;
}

export interface TimelineItemBase<DateType> {
  id: Id;
  group: Id;
  title?: React.ReactNode;
  start_time: DateType;
  end_time: DateType;
  canMove?: boolean;
  canResize?: boolean | 'left' | 'right' | 'both';
  canChangeGroup?: boolean;
  className?: string;
  style?: React.CSSProperties;
  itemProps?: React.HTMLAttributes<HTMLDivElement>;
}

export type TimelineGroup<CustomData = {}> = TimelineGroupBase & CustomData;
export type TimelineItem<
  CustomData = {},
  DateType = number,
> = TimelineItemBase<DateType> & CustomData;
