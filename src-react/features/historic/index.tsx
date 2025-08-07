import React, { useState } from 'react';
import {
  Play,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const History = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [selectedUndoStep, setSelectedUndoStep] = useState(0);

  const snapshots = [
    { id: 1, name: 'Distorted Synth Final V7', type: 'snapshot' },
    { id: 2, name: 'Weekend Snapshot 5', type: 'snapshot' },
  ];

  const undoSteps = [
    { id: 1, action: 'Insert Clip', time: 'Wed Apr 26 01:05:13' },
    { id: 2, action: 'Change Track Name', time: 'Wed Apr 26 01:05:44' },
    { id: 3, action: 'Insert Audio Track', time: 'Wed Apr 26 01:06:08' },
    { id: 4, action: 'Change Routing', time: 'Wed Apr 26 01:06:41' },
    { id: 5, action: 'Change Panning to Balance', time: 'Wed Apr 26 01:06:52' },
  ];

  return (
    <div className="w-full rounded-lg overflow-hidden text-muted-foreground">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          backgroundColor: 'hsl(var(--surface-lowered))',
          borderColor: 'hsl(var(--border))',
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-6 w-6 hover:bg-opacity-10"
            style={{
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {isCollapsed ? (
              <ChevronRight size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </Button>
          <Play size={16} style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span
            className="text-sm font-medium"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            History
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {snapshots.length + undoSteps.length} items
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
            style={{
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            <MoreVertical size={16} />
          </Button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="divide-y" style={{ borderColor: 'hsl(var(--border))' }}>
          {/* Snapshots Section */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown
                size={14}
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                SNAPSHOTS
              </span>
            </div>
            <div className="space-y-1">
              {snapshots.map((snapshot) => (
                <div
                  key={snapshot.id}
                  className="flex items-center justify-between py-2 px-3 rounded-sm transition-colors cursor-pointer group"
                  style={{
                    backgroundColor:
                      selectedSnapshot === snapshot.id
                        ? 'hsl(var(--accent))'
                        : 'transparent',
                    color:
                      selectedSnapshot === snapshot.id
                        ? 'hsl(var(--accent-foreground))'
                        : 'hsl(var(--foreground))',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedSnapshot !== snapshot.id) {
                      e.currentTarget.style.backgroundColor =
                        'hsl(var(--surface-hover))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedSnapshot !== snapshot.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() =>
                    setSelectedSnapshot(
                      selectedSnapshot === snapshot.id ? null : snapshot.id,
                    )
                  }
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight
                      size={14}
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <Folder
                      size={16}
                      style={{ color: 'hsl(var(--warning))' }}
                    />
                    <span className="text-sm">{snapshot.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono"
                      style={{
                        color:
                          selectedSnapshot === snapshot.id
                            ? 'hsl(var(--accent-foreground))'
                            : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      SNAPSHOT
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Undo Section */}
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-3">
              <ChevronDown
                size={14}
                style={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <span
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'hsl(var(--muted-foreground))' }}
              >
                UNDO HISTORY
              </span>
            </div>
            <div className="space-y-1">
              {undoSteps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center justify-between py-2 px-3 rounded-sm transition-colors cursor-pointer group"
                  style={{
                    backgroundColor:
                      selectedUndoStep === index
                        ? 'hsl(var(--accent))'
                        : 'transparent',
                    color:
                      selectedUndoStep === index
                        ? 'hsl(var(--accent-foreground))'
                        : 'hsl(var(--foreground))',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUndoStep !== index) {
                      e.currentTarget.style.backgroundColor =
                        'hsl(var(--surface-hover))';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUndoStep !== index) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  onClick={() => setSelectedUndoStep(index)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <ChevronRight
                      size={14}
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm">{step.action}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-mono"
                      style={{
                        color:
                          selectedUndoStep === index
                            ? 'hsl(var(--accent-foreground))'
                            : 'hsl(var(--muted-foreground))',
                      }}
                    >
                      {step.time}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                      style={{ color: 'hsl(var(--muted-foreground))' }}
                    >
                      <MoreVertical size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Controls */}
          <div
            className="px-4 py-3 flex justify-between items-center"
            style={{ backgroundColor: 'hsl(var(--surface-lowered))' }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="text-xs px-3 py-1.5 h-7"
              style={{
                backgroundColor: 'hsl(var(--secondary))',
                color: 'hsl(var(--secondary-foreground))',
              }}
            >
              Delete
            </Button>
            <Button
              size="sm"
              className="text-xs px-3 py-1.5 h-7 font-medium"
              style={{
                backgroundColor: 'hsl(var(--warning))',
                color: 'hsl(var(--warning-foreground))',
              }}
            >
              Snapshot
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
