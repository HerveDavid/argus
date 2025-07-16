import { Play, Pause, RotateCcw, Plus, Edit2, Trash2, Users, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import react-calendar-timeline
import Timeline, {
  TimelineHeaders,
  SidebarHeader,
  DateHeader,
  TimelineMarkers,
  TodayMarker,
  CustomMarker,
  CursorMarker
} from 'react-calendar-timeline';
import moment from 'moment';

// Import des styles CSS requis
import './style.css';

export const TimelineEditor = () => {
  // Configuration du temps
  const startTime = moment('2024-01-01 08:00:00');
  const endTime = moment('2024-01-01 20:00:00');
  const [currentTime, setCurrentTime] = useState(startTime.valueOf());
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  // Temps visible de la timeline
  const [visibleTimeStart, setVisibleTimeStart] = useState(startTime.valueOf());
  const [visibleTimeEnd, setVisibleTimeEnd] = useState(endTime.valueOf());

  // État de l'éditeur
  const [editMode, setEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);

  // Données des groupes
  const [groups, setGroups] = useState([
    { id: 1, title: 'Équipe Dev', rightTitle: 'Développement' },
    { id: 2, title: 'Équipe Design', rightTitle: 'Design UI/UX' },
    { id: 3, title: 'Équipe QA', rightTitle: 'Tests & Qualité' },
    { id: 4, title: 'Product Manager', rightTitle: 'Gestion Produit' },
  ]);

  // Données des items
  const [items, setItems] = useState([
    {
      id: 1,
      group: 1,
      title: 'Développement API',
      start_time: moment('2024-01-01 09:00:00'),
      end_time: moment('2024-01-01 15:00:00'),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: '#10B981',
          color: 'white',
          border: '1px solid #059669',
          borderRadius: '4px'
        }
      }
    },
    {
      id: 2,
      group: 2,
      title: 'Maquettes UI',
      start_time: moment('2024-01-01 08:30:00'),
      end_time: moment('2024-01-01 12:00:00'),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: '#8B5CF6',
          color: 'white',
          border: '1px solid #7C3AED',
          borderRadius: '4px'
        }
      }
    },
    {
      id: 3,
      group: 1,
      title: 'Integration Frontend',
      start_time: moment('2024-01-01 13:00:00'),
      end_time: moment('2024-01-01 17:30:00'),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: '#3B82F6',
          color: 'white',
          border: '1px solid #2563EB',
          borderRadius: '4px'
        }
      }
    },
    {
      id: 4,
      group: 3,
      title: 'Tests Unitaires',
      start_time: moment('2024-01-01 14:00:00'),
      end_time: moment('2024-01-01 18:00:00'),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: '#F59E0B',
          color: 'white',
          border: '1px solid #D97706',
          borderRadius: '4px'
        }
      }
    },
    {
      id: 5,
      group: 4,
      title: 'Review & Validation',
      start_time: moment('2024-01-01 16:00:00'),
      end_time: moment('2024-01-01 19:00:00'),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: '#EF4444',
          color: 'white',
          border: '1px solid #DC2626',
          borderRadius: '4px'
        }
      }
    },
  ]);

  // Formulaires
  const [newItem, setNewItem] = useState({
    title: '',
    group: '',
    start_time: '',
    end_time: '',
    description: '',
    color: '#3B82F6'
  });

  const [newGroup, setNewGroup] = useState({
    title: '',
    rightTitle: ''
  });

  // Logique de lecture temporelle
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1000 * 60 * 5 * playSpeed; // 5 minutes par step
          if (newTime >= endTime.valueOf()) {
            setIsPlaying(false);
            return endTime.valueOf();
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, endTime]);

  // Gestionnaires d'événements
  const handlePlay = () => setIsPlaying(!isPlaying);

  const handleReset = () => {
    setCurrentTime(startTime.valueOf());
    setIsPlaying(false);
  };

  const handleTimeChange = (visibleTimeStart, visibleTimeEnd, updateScrollCanvas) => {
    setVisibleTimeStart(visibleTimeStart);
    setVisibleTimeEnd(visibleTimeEnd);
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
  };

  const handleItemMove = (itemId, dragTime, newGroupOrder) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const duration = item.end_time.valueOf() - item.start_time.valueOf();
    const newStartTime = moment(dragTime);
    const newEndTime = moment(dragTime + duration);

    setItems(items.map(i =>
      i.id === itemId
        ? {
          ...i,
          start_time: newStartTime,
          end_time: newEndTime,
          group: groups[newGroupOrder].id
        }
        : i
    ));
  };

  const handleItemResize = (itemId, time, edge) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        return edge === 'left'
          ? { ...item, start_time: moment(time) }
          : { ...item, end_time: moment(time) };
      }
      return item;
    }));
  };

  const handleItemSelect = (itemId, e, time) => {
    setSelectedItems([itemId]);
  };

  const handleItemClick = (itemId, e, time) => {
    console.log('Item clicked:', itemId, 'at time:', moment(time).format('HH:mm'));
  };

  const handleCanvasClick = (groupId, time, e) => {
    if (editMode) {
      // Ouvrir le modal d'ajout avec le groupe et le temps pré-remplis
      setNewItem({
        ...newItem,
        group: groupId,
        start_time: moment(time).format('YYYY-MM-DDTHH:mm'),
        end_time: moment(time).add(1, 'hour').format('YYYY-MM-DDTHH:mm')
      });
      setShowAddItemModal(true);
    }
  };

  const handleAddItem = () => {
    if (!newItem.title || !newItem.group || !newItem.start_time || !newItem.end_time) {
      return;
    }

    const item = {
      id: Date.now(),
      title: newItem.title,
      group: parseInt(newItem.group),
      start_time: moment(newItem.start_time),
      end_time: moment(newItem.end_time),
      canMove: true,
      canResize: true,
      canChangeGroup: true,
      itemProps: {
        style: {
          background: newItem.color,
          color: 'white',
          border: `1px solid ${newItem.color}`,
          borderRadius: '4px'
        }
      }
    };

    setItems([...items, item]);
    setNewItem({ title: '', group: '', start_time: '', end_time: '', description: '', color: '#3B82F6' });
    setShowAddItemModal(false);
  };

  const handleAddGroup = () => {
    if (!newGroup.title) return;

    const group = {
      id: Date.now(),
      title: newGroup.title,
      rightTitle: newGroup.rightTitle || newGroup.title
    };

    setGroups([...groups, group]);
    setNewGroup({ title: '', rightTitle: '' });
    setShowAddGroupModal(false);
  };

  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    setSelectedItems(selectedItems.filter(id => id !== itemId));
  };

  const handleDeleteGroup = (groupId) => {
    const hasItems = items.some(item => item.group === groupId);
    if (hasItems) {
      alert('Impossible de supprimer un groupe qui contient des tâches');
      return;
    }
    setGroups(groups.filter(group => group.id !== groupId));
  };

  // Renderer personnalisé pour les items
  const itemRenderer = ({ item, itemContext, getItemProps, getResizeProps }) => {
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    const isSelected = selectedItems.includes(item.id);
    const isActive = currentTime >= item.start_time.valueOf() && currentTime <= item.end_time.valueOf();
    const isCompleted = currentTime > item.end_time.valueOf();

    return (
      <div
        {...getItemProps({
          style: {
            ...item.itemProps.style,
            opacity: isCompleted ? 0.6 : 1,
            boxShadow: isActive ? '0 0 0 2px #fbbf24' : isSelected ? '0 0 0 2px #3b82f6' : 'none',
            cursor: editMode ? 'move' : 'pointer'
          }
        })}
      >
        {editMode && itemContext.useResizeHandle && <div {...leftResizeProps} />}

        <div className="px-2 py-1 text-xs">
          <div className="font-medium truncate">{itemContext.title}</div>
          <div className="text-xs opacity-75">
            {item.start_time.format('HH:mm')} - {item.end_time.format('HH:mm')}
          </div>
        </div>

        {editMode && itemContext.useResizeHandle && <div {...rightResizeProps} />}
      </div>
    );
  };

  // Renderer personnalisé pour les groupes
  const groupRenderer = ({ group }) => {
    return (
      <div className="flex items-center justify-between h-full px-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-medium text-sm">{group.title}</span>
        </div>
        {editMode && (
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteGroup(group.id)}
              className="h-6 w-6 p-0"
            >
              <Trash2 size={12} />
            </Button>
          </div>
        )}
      </div>
    );
  };

  const getCurrentTasks = () => {
    return items.filter(
      (item) => currentTime >= item.start_time.valueOf() && currentTime <= item.end_time.valueOf()
    );
  };

  const getProgress = () => {
    return ((currentTime - startTime.valueOf()) / (endTime.valueOf() - startTime.valueOf())) * 100;
  };

  return (
    <div className="max-w-full mx-auto min-h-screen bg-background">
      {/* Barre d'outils */}
      <Card className="mb-4 border-none shadow-none">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button onClick={handlePlay} className="gap-2">
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>

              <Button variant="outline" onClick={handleReset} className="gap-2">
                <RotateCcw size={16} />
                Reset
              </Button>

              <div className="flex items-center space-x-2">
                <Label className="text-sm">Vitesse:</Label>
                {[0.5, 1, 2, 4].map((speed) => (
                  <Button
                    key={speed}
                    variant={playSpeed === speed ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPlaySpeed(speed)}
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-mode"
                  checked={editMode}
                  onCheckedChange={setEditMode}
                />
                <Label htmlFor="edit-mode">Mode édition</Label>
              </div>

              <Dialog open={showAddItemModal} onOpenChange={setShowAddItemModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus size={16} />
                    Ajouter tâche
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter une nouvelle tâche</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="task-title">Titre *</Label>
                      <Input
                        id="task-title"
                        value={newItem.title}
                        onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                        placeholder="Nom de la tâche"
                      />
                    </div>

                    <div>
                      <Label htmlFor="task-group">Groupe *</Label>
                      <Select value={newItem.group.toString()} onValueChange={(value) => setNewItem({...newItem, group: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un groupe" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="task-start">Début *</Label>
                        <Input
                          id="task-start"
                          type="datetime-local"
                          value={newItem.start_time}
                          onChange={(e) => setNewItem({...newItem, start_time: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="task-end">Fin *</Label>
                        <Input
                          id="task-end"
                          type="datetime-local"
                          value={newItem.end_time}
                          onChange={(e) => setNewItem({...newItem, end_time: e.target.value})}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="task-color">Couleur</Label>
                      <Input
                        id="task-color"
                        type="color"
                        value={newItem.color}
                        onChange={(e) => setNewItem({...newItem, color: e.target.value})}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddItemModal(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddItem}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={showAddGroupModal} onOpenChange={setShowAddGroupModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Users size={16} />
                    Ajouter groupe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajouter un nouveau groupe</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="group-title">Nom du groupe *</Label>
                      <Input
                        id="group-title"
                        value={newGroup.title}
                        onChange={(e) => setNewGroup({...newGroup, title: e.target.value})}
                        placeholder="Nom du groupe"
                      />
                    </div>

                    <div>
                      <Label htmlFor="group-right-title">Titre droite</Label>
                      <Input
                        id="group-right-title"
                        value={newGroup.rightTitle}
                        onChange={(e) => setNewGroup({...newGroup, rightTitle: e.target.value})}
                        placeholder="Titre pour la sidebar droite"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddGroupModal(false)}>
                        Annuler
                      </Button>
                      <Button onClick={handleAddGroup}>
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Informations de statut */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <Label>Temps actuel:</Label>
              <div className="font-mono">{moment(currentTime).format('HH:mm')}</div>
            </div>
            <div>
              <Label>Progression:</Label>
              <div className="font-mono">{getProgress().toFixed(1)}%</div>
            </div>
            <div>
              <Label>Tâches actives:</Label>
              <div className="font-mono">{getCurrentTasks().length}</div>
            </div>
            <div>
              <Label>Mode:</Label>
              <div className="font-mono">{editMode ? 'Édition' : 'Lecture'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline principale */}
      <Card className="border-none shadow-none">
        <CardContent className="p-4">
          <div className="overflow-hidden">
            <Timeline
              groups={groups}
              items={items}
              defaultTimeStart={startTime}
              defaultTimeEnd={endTime}
              visibleTimeStart={visibleTimeStart}
              visibleTimeEnd={visibleTimeEnd}
              onTimeChange={handleTimeChange}
              onItemMove={handleItemMove}
              onItemResize={handleItemResize}
              onItemSelect={handleItemSelect}
              onItemClick={handleItemClick}
              onCanvasClick={handleCanvasClick}
              canMove={editMode}
              canResize={editMode ? 'both' : false}
              canChangeGroup={editMode}
              itemRenderer={itemRenderer}
              groupRenderer={groupRenderer}
              lineHeight={50}
              sidebarWidth={200}
              rightSidebarWidth={150}
              dragSnap={15 * 60 * 1000} // 15 minutes
              buffer={3}
              stackItems={true}
              itemTouchSendsClick={false}
              timeSteps={{ minute: 15, hour: 1, day: 1 }}
            >
              <TimelineHeaders>
                <SidebarHeader>
                  {({ getRootProps }) => (
                    <div {...getRootProps()} className="flex items-center justify-center h-full bg-muted">
                      <span className="font-medium text-sm">Équipes</span>
                    </div>
                  )}
                </SidebarHeader>
                <DateHeader unit="primaryHeader" />
                <DateHeader />
              </TimelineHeaders>

              <TimelineMarkers>
                <CustomMarker date={currentTime}>
                  {({ styles }) => (
                    <div
                      style={{
                        ...styles,
                        backgroundColor: '#ef4444',
                        width: '2px',
                        zIndex: 100
                      }}
                    />
                  )}
                </CustomMarker>
                <CursorMarker />
              </TimelineMarkers>
            </Timeline>
          </div>
        </CardContent>
      </Card>

      {/* Panneau d'informations */}
      {selectedItems.length > 0 && (
        <Card className="mt-4 border-none shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Tâches sélectionnées</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedItems.forEach(handleDeleteItem)}
                className="gap-2"
              >
                <Trash2 size={14} />
                Supprimer
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {selectedItems.map(itemId => {
                const item = items.find(i => i.id === itemId);
                const group = groups.find(g => g.id === item?.group);
                if (!item) return null;

                return (
                  <div key={itemId} className="p-3 bg-muted rounded-lg">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {group?.title} • {item.start_time.format('HH:mm')} - {item.end_time.format('HH:mm')}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tâches en cours */}
      {getCurrentTasks().length > 0 && (
        <Card className="mt-4 border-none shadow-none">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Clock size={16} />
              Tâches en cours
            </h3>
            <div className="space-y-2">
              {getCurrentTasks().map(task => {
                const group = groups.find(g => g.id === task.group);
                return (
                  <div key={task.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div>
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {group?.title} • {task.start_time.format('HH:mm')} - {task.end_time.format('HH:mm')}
                      </div>
                    </div>
                    <Badge variant="secondary">En cours</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}