import { Play, Pause, RotateCcw, Plus, Edit2, Trash2, Save, X, Calendar, Clock, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

export function TimelineEditor() {
  // Configuration du temps
  const startTime = new Date('2024-01-01T08:00:00').getTime();
  const endTime = new Date('2024-01-01T20:00:00').getTime();
  const [currentTime, setCurrentTime] = useState(startTime);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);

  // État de l'éditeur
  const [editMode, setEditMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Données
  const [groups, setGroups] = useState([
    { id: 'dev', title: 'Équipe Dev', color: '#10B981' },
    { id: 'design', title: 'Équipe Design', color: '#8B5CF6' },
    { id: 'qa', title: 'Équipe QA', color: '#F59E0B' },
    { id: 'product', title: 'Product Manager', color: '#EF4444' },
  ]);

  const [items, setItems] = useState([
    {
      id: 'task1',
      group: 'dev',
      title: 'Développement API',
      start_time: new Date('2024-01-01T09:00:00').getTime(),
      end_time: new Date('2024-01-01T15:00:00').getTime(),
      color: '#10B981',
      description: 'Développement de l\'API REST pour le projet'
    },
    {
      id: 'task2',
      group: 'design',
      title: 'Maquettes UI',
      start_time: new Date('2024-01-01T08:30:00').getTime(),
      end_time: new Date('2024-01-01T12:00:00').getTime(),
      color: '#8B5CF6',
      description: 'Création des maquettes d\'interface utilisateur'
    },
    {
      id: 'task3',
      group: 'dev',
      title: 'Integration Frontend',
      start_time: new Date('2024-01-01T13:00:00').getTime(),
      end_time: new Date('2024-01-01T17:30:00').getTime(),
      color: '#3B82F6',
      description: 'Intégration du frontend avec l\'API'
    },
    {
      id: 'task4',
      group: 'qa',
      title: 'Tests Unitaires',
      start_time: new Date('2024-01-01T14:00:00').getTime(),
      end_time: new Date('2024-01-01T18:00:00').getTime(),
      color: '#F59E0B',
      description: 'Écriture et exécution des tests unitaires'
    },
    {
      id: 'task5',
      group: 'product',
      title: 'Review & Validation',
      start_time: new Date('2024-01-01T16:00:00').getTime(),
      end_time: new Date('2024-01-01T19:00:00').getTime(),
      color: '#EF4444',
      description: 'Révision et validation du produit'
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
    color: '#6B7280'
  });

  // Logique de lecture temporelle
  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prevTime) => {
          const newTime = prevTime + 1000 * 60 * 5 * playSpeed;
          if (newTime >= endTime) {
            setIsPlaying(false);
            return endTime;
          }
          return newTime;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playSpeed, endTime]);

  // Fonctions utilitaires
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getProgress = () => {
    return ((currentTime - startTime) / (endTime - startTime)) * 100;
  };

  const getCurrentTasks = () => {
    return items.filter(
      (item) => currentTime >= item.start_time && currentTime <= item.end_time
    );
  };

  const getCompletedTasks = () => {
    return items.filter((item) => currentTime > item.end_time);
  };

  const timeToPixel = (time) => {
    const totalDuration = endTime - startTime;
    const timeOffset = time - startTime;
    return (timeOffset / totalDuration) * 800;
  };

  const pixelToTime = (pixel) => {
    const totalDuration = endTime - startTime;
    return startTime + (pixel / 800) * totalDuration;
  };

  // Gestionnaires d'événements
  const handlePlay = () => setIsPlaying(!isPlaying);

  const handleReset = () => {
    setCurrentTime(startTime);
    setIsPlaying(false);
  };

  const handleTimeSliderChange = (value) => {
    const percentage = value[0];
    const newTime = startTime + (endTime - startTime) * (percentage / 100);
    setCurrentTime(newTime);
  };

  const handleAddItem = () => {
    if (!newItem.title || !newItem.group || !newItem.start_time || !newItem.end_time) {
      return;
    }

    const item = {
      id: Date.now().toString(),
      title: newItem.title,
      group: newItem.group,
      start_time: new Date(newItem.start_time).getTime(),
      end_time: new Date(newItem.end_time).getTime(),
      color: newItem.color,
      description: newItem.description
    };

    setItems([...items, item]);
    setNewItem({ title: '', group: '', start_time: '', end_time: '', description: '', color: '#3B82F6' });
    setShowAddItemModal(false);
  };

  const handleAddGroup = () => {
    if (!newGroup.title) {
      return;
    }

    const group = {
      id: Date.now().toString(),
      title: newGroup.title,
      color: newGroup.color
    };

    setGroups([...groups, group]);
    setNewGroup({ title: '', color: '#6B7280' });
    setShowAddGroupModal(false);
  };

  const handleDeleteItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
    setSelectedItem(null);
  };

  const handleDeleteGroup = (groupId) => {
    const hasItems = items.some(item => item.group === groupId);
    if (hasItems) {
      return;
    }
    setGroups(groups.filter(group => group.id !== groupId));
    setSelectedGroup(null);
  };

  const handleItemDragStart = (e, item) => {
    setDraggedItem(item);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleItemDragOver = (e) => {
    e.preventDefault();
  };

  const handleItemDrop = (e, targetGroup) => {
    e.preventDefault();
    if (!draggedItem) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const newStartTime = pixelToTime(x);
    const duration = draggedItem.end_time - draggedItem.start_time;

    const updatedItems = items.map(item => {
      if (item.id === draggedItem.id) {
        return {
          ...item,
          group: targetGroup,
          start_time: newStartTime,
          end_time: newStartTime + duration
        };
      }
      return item;
    });

    setItems(updatedItems);
    setDraggedItem(null);
  };

  return (
    <div className="max-w-full mx-auto min-h-screen">
      {/* Barre d'outils */}
      <Card className="mb-2 border-none shadow-none">
        <CardContent className="p-2">
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
                      <Select value={newItem.group} onValueChange={(value) => setNewItem({...newItem, group: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un groupe" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(group => (
                            <SelectItem key={group.id} value={group.id}>
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
                      <Label htmlFor="task-description">Description</Label>
                      <Textarea
                        id="task-description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                        placeholder="Description de la tâche"
                      />
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
                      <Label htmlFor="group-color">Couleur</Label>
                      <Input
                        id="group-color"
                        type="color"
                        value={newGroup.color}
                        onChange={(e) => setNewGroup({...newGroup, color: e.target.value})}
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

          {/* Contrôle temporel */}
          <div className="space-y-2">
            <Slider
              value={[getProgress()]}
              onValueChange={handleTimeSliderChange}
              max={100}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Temps actuel: <strong>{formatTime(currentTime)}</strong></span>
              <span>Progression: <strong>{getProgress().toFixed(1)}%</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline principale */}
      <Card className="mb-2 bg-background border-none shadow-none">
        <CardContent className="px-2">
          {/* En-tête de temps */}
          <div className="flex mb-4">
            <div className="w-48 flex-shrink-0"></div>
            <div className="flex-1 relative">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                {Array.from({ length: 13 }, (_, i) => {
                  const hour = 8 + i;
                  return (
                    <div key={hour} className="text-center">
                      {hour}:00
                    </div>
                  );
                })}
              </div>
              <div className="h-px bg-border relative">
                <div
                  className="absolute top-0 w-0.5 h-8 bg-red-500 z-10"
                  style={{ left: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>

          {/* Groupes et tâches */}
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="flex">
                {/* Nom du groupe */}
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-medium">
                        {group.title}
                      </span>
                    </div>
                    {editMode && (
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedGroup(group)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Zone de tâches */}
                <div
                  className="flex-1 relative h-12 border border-border rounded"
                  onDragOver={handleItemDragOver}
                  onDrop={(e) => handleItemDrop(e, group.id)}
                >
                  {items
                    .filter(item => item.group === group.id)
                    .map((item) => {
                      const startPercent = ((item.start_time - startTime) / (endTime - startTime)) * 100;
                      const widthPercent = ((item.end_time - item.start_time) / (endTime - startTime)) * 100;
                      const isActive = currentTime >= item.start_time && currentTime <= item.end_time;
                      const isCompleted = currentTime > item.end_time;

                      return (
                        <div
                          key={item.id}
                          className={`absolute top-1 h-10 rounded px-2 py-1 text-xs text-white cursor-pointer transition-all ${
                            isActive ? 'ring-2 ring-yellow-400' : ''
                          } ${isCompleted ? 'opacity-60' : ''}`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`,
                            backgroundColor: item.color
                          }}
                          draggable={editMode}
                          onDragStart={(e) => handleItemDragStart(e, item)}
                          onClick={() => editMode && setSelectedItem(item)}
                        >
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-xs opacity-75">
                            {formatTime(item.start_time)} - {formatTime(item.end_time)}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
