import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  TrendingUp,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useTaskStore } from '@/hooks/use-task';

const TaskCard = ({ task, onAction }) => {
  const taskStore = useTaskStore();
  const actionState = taskStore.getTaskActionState(task.taskId);
  const taskError = taskStore.taskErrors.get(task.taskId);

  const getStatusIcon = () => {
    if (task.isRunning) {
      return <Activity className="h-4 w-4 text-green-500" />;
    } else if (task.isPaused) {
      return <Pause className="h-4 w-4 text-yellow-500" />;
    } else {
      return <Square className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    if (task.isRunning) {
      return (
        <Badge variant="default" className="bg-green-500">
          Running
        </Badge>
      );
    } else if (task.isPaused) {
      return (
        <Badge variant="secondary" className="bg-yellow-500">
          Paused
        </Badge>
      );
    } else {
      return <Badge variant="outline">Stopped</Badge>;
    }
  };

  const isLoading = Object.values(actionState).some(Boolean);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <CardTitle className="text-sm font-medium">{task.taskId}</CardTitle>
        </div>
        {getStatusBadge()}
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-3">
          <CheckCircle className="h-3 w-3" />
          <span>Exists: {task.exists ? 'Yes' : 'No'}</span>
        </div>

        {taskError && (
          <Alert className="mb-3" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {taskError.message}
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-auto p-0 text-xs"
                onClick={() => taskStore.clearTaskError(task.taskId)}
              >
                Clear
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('start', task.taskId)}
            disabled={isLoading || task.isRunning}
            className="text-xs"
          >
            {actionState.isStarting ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Start
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('pause', task.taskId)}
            disabled={isLoading || !task.isRunning}
            className="text-xs"
          >
            {actionState.isPausing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Pause className="h-3 w-3 mr-1" />
            )}
            Pause
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onAction('resume', task.taskId)}
            disabled={isLoading || !task.isPaused}
            className="text-xs"
          >
            {actionState.isResuming ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Play className="h-3 w-3 mr-1" />
            )}
            Resume
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => onAction('close', task.taskId)}
            disabled={isLoading}
            className="text-xs"
          >
            {actionState.isClosing ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Square className="h-3 w-3 mr-1" />
            )}
            Close
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAction('refresh', task.taskId)}
            disabled={actionState.isLoadingStatus}
            className="text-xs"
          >
            {actionState.isLoadingStatus ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const StatisticsCard = ({ title, value, description, icon: Icon, trend }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
      {trend && (
        <div className="flex items-center mt-2 text-xs">
          <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
          <span className="text-green-500">+{trend}%</span>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function TaskDashboard() {
  const taskStore = useTaskStore();
  const [newTaskId, setNewTaskId] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!taskStore.isReady) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading task store...</span>
      </div>
    );
  }

  const handleTaskAction = async (action, taskId) => {
    try {
      switch (action) {
        case 'start':
          await taskStore.startTask(taskId);
          break;
        case 'pause':
          await taskStore.pauseTask(taskId);
          break;
        case 'resume':
          await taskStore.resumeTask(taskId);
          break;
        case 'close':
          await taskStore.closeTask(taskId);
          break;
        case 'refresh':
          await taskStore.refreshTask(taskId);
          break;
      }
    } catch (error) {
      console.error(`Failed to ${action} task ${taskId}:`, error);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      await taskStore.refreshAll();
    } catch (error) {
      console.error('Failed to refresh all tasks:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNewTask = async () => {
    if (!newTaskId.trim()) return;

    try {
      await taskStore.startTask(newTaskId.trim());
      setNewTaskId('');
    } catch (error) {
      console.error('Failed to start new task:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Task Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage your tasks</p>
        </div>
        <Button
          onClick={handleRefreshAll}
          disabled={isRefreshing || taskStore.isAnyTaskLoading}
          variant="outline"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh All
        </Button>
      </div>

      {taskStore.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {taskStore.error.message}
            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={taskStore.clearError}
            >
              Clear
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatisticsCard
          title="Total Tasks"
          value={taskStore.taskCount}
          description="All registered tasks"
          icon={BarChart3}
        />
        <StatisticsCard
          title="Running Tasks"
          value={taskStore.runningTasks.length}
          description="Currently active"
          icon={Activity}
          trend="12"
        />
        <StatisticsCard
          title="Paused Tasks"
          value={taskStore.pausedTasks.length}
          description="Temporarily stopped"
          icon={Pause}
        />
        <StatisticsCard
          title="Success Rate"
          value={
            taskStore.tasksStatistics
              ? `${Math.round(((taskStore.tasksStatistics.completed || 0) / (taskStore.tasksStatistics.total || 1)) * 100)}%`
              : 'N/A'
          }
          description="Completion percentage"
          icon={CheckCircle}
          trend="5"
        />
      </div>

      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">All Tasks</TabsTrigger>
          <TabsTrigger value="running">
            Running ({taskStore.runningTasks.length})
          </TabsTrigger>
          <TabsTrigger value="paused">
            Paused ({taskStore.pausedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from(taskStore.tasks.values()).map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onAction={handleTaskAction}
              />
            ))}
          </div>

          {taskStore.tasks.size === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No tasks available</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {taskStore.runningTasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onAction={handleTaskAction}
              />
            ))}
          </div>

          {taskStore.runningTasks.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No running tasks</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paused" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {taskStore.pausedTasks.map((task) => (
              <TaskCard
                key={task.taskId}
                task={task}
                onAction={handleTaskAction}
              />
            ))}
          </div>

          {taskStore.pausedTasks.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center">
                  <Pause className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No paused tasks</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>
                Start a new task by providing a task ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="taskId">Task ID</Label>
                  <Input
                    id="taskId"
                    placeholder="Enter task ID..."
                    value={newTaskId}
                    onChange={(e) => setNewTaskId(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleNewTask()}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleNewTask}
                    disabled={!newTaskId.trim() || taskStore.isAnyTaskLoading}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Task
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Quick Actions</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshAll}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={taskStore.clearError}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Clear Errors
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {taskStore.tasksStatistics && (
            <Card>
              <CardHeader>
                <CardTitle>Task Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Total Tasks:</span>
                    <span className="font-medium">
                      {taskStore.tasksStatistics.total}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Running:</span>
                    <span className="font-medium text-green-600">
                      {taskStore.tasksStatistics.running}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Paused:</span>
                    <span className="font-medium text-yellow-600">
                      {taskStore.tasksStatistics.paused}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Completed:</span>
                    <span className="font-medium text-blue-600">
                      {taskStore.tasksStatistics.completed || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Failed:</span>
                    <span className="font-medium text-red-600">
                      {taskStore.tasksStatistics.failed || 0}
                    </span>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Success Rate:</span>
                      <span className="font-medium">
                        {Math.round(
                          ((taskStore.tasksStatistics.completed || 0) /
                            (taskStore.tasksStatistics.total || 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        ((taskStore.tasksStatistics.completed || 0) /
                          (taskStore.tasksStatistics.total || 1)) *
                        100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
