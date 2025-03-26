import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useSubstations } from '@/features/network/hooks/use-substations';
import { useSubstationDetails } from '@/features/network/hooks/use-substation-details';
import { NetworkExplorer } from '@/features/network/components/network-explorer';

// Define types for our data
interface CollectionItem {
  name: string;
  color: string;
}

interface CategoryItem {
  name: string;
  icon: string;
  items: string[];
}

// Component for section headers
interface SectionHeaderProps {
  title: string;
  expanded: boolean;
  onToggle: () => void;
}

const SectionHeader = ({ title, expanded, onToggle }: SectionHeaderProps) => (
  <CollapsibleTrigger
    className="p-1 font-semibold bg-gray-200 hover:bg-gray-300 cursor-pointer flex items-center w-full"
    onClick={onToggle}
  >
    <ChevronDown
      className={cn(
        'h-3 w-3 mr-1 transition-transform duration-200',
        !expanded && '-rotate-90',
      )}
    />
    {title}
  </CollapsibleTrigger>
);

const Browser = () => {
  const [selectedSubstationId, setSelectedSubstationId] = useState<string>();

  const substationsData = useSubstations();
  const substationDetails = useSubstationDetails(selectedSubstationId);

  const handleSubstationSelect = (id: string) => {
    setSelectedSubstationId(id);
  };

  // State to track which sections are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    collections: false,
    categories: false,
  });

  // State to track selected category
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Collections section data
  const collections: CollectionItem[] = [
    { name: 'Favorites', color: 'red' },
    { name: 'Orange', color: 'orange' },
    { name: 'Yellow', color: 'yellow' },
    { name: 'Green', color: 'green' },
    { name: 'Blue', color: 'blue' },
    { name: 'Purple', color: 'purple' },
    { name: 'Gray', color: 'gray' },
  ];

  // Categories section data with items
  const categories: CategoryItem[] = [
    {
      name: 'Substations',
      icon: '🕹️',
      items: [
        'Substation A',
        'Substation B',
        'Substation C',
        'Substation D',
        'Substation E',
      ],
    },
    {
      name: 'Voltage Levels',
      icon: '⚡',
      items: ['110 kV', '220 kV', '380 kV', '400 kV', '500 kV'],
    },
    {
      name: 'Lines',
      icon: '│',
      items: ['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6'],
    },
  ];

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle category selection
  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(
      categoryName === selectedCategory ? null : categoryName,
    );
  };

  // Get selected category data
  const getSelectedCategoryItems = () => {
    if (!selectedCategory) return [];
    const category = categories.find((cat) => cat.name === selectedCategory);
    return category?.items || [];
  };

  const getColorClass = (color: string): string => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-500',
    };

    return colorMap[color] || 'bg-gray-500';
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar */}
      <div className="flex flex-col h-full bg-gray-100 text-xs w-56 overflow-y-auto border-r border-gray-300">
        {/* Search */}
        <div className="p-2 border-b border-gray-300">
          <div className="relative">
            <Input
              className="w-full pl-6 py-1 text-xs bg-gray-100 border border-gray-300"
              placeholder="Search (Ctrl+F)"
            />
          </div>
        </div>

        {/* Collections section */}
        <Collapsible open={expanded.collections} className="my-2">
          <SectionHeader
            title="Collections"
            expanded={expanded.collections}
            onToggle={() => toggleSection('collections')}
          />
          <CollapsibleContent>
            {collections.map((item, index) => (
              <div
                key={index}
                className="pl-2 hover:bg-gray-200 p-1 flex items-center"
              >
                <span
                  className={`w-2 h-2 mr-2 rounded-full ${getColorClass(
                    item.color,
                  )}`}
                ></span>
                <span>{item.name}</span>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Categories section */}
        <Collapsible open={expanded.categories} className="my-2">
          <SectionHeader
            title="Categories"
            expanded={expanded.categories}
            onToggle={() => toggleSection('categories')}
          />
          <CollapsibleContent>
            {categories.map((item, index) => (
              <div
                key={index}
                className={cn(
                  'pl-2 hover:bg-gray-200 p-1 flex items-center cursor-pointer',
                  selectedCategory === item.name && 'bg-blue-100',
                )}
                onClick={() => handleCategorySelect(item.name)}
              >
                <span className="ml-4 mr-2">{item.icon}</span>
                <span>{item.name}</span>
                {selectedCategory === item.name && (
                  <ChevronRight className="h-3 w-3 ml-auto" />
                )}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Right panel - only shows when a category is selected */}
      {selectedCategory && (
        <div className="flex-1 bg-white p-2 overflow-y-auto">
          <div className="grid grid-cols-1 gap-1">
            <NetworkExplorer
              title={selectedCategory}
              substationsData={substationsData}
              selectedSubstationId={selectedSubstationId}
              onSubstationSelect={handleSubstationSelect}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Browser;
