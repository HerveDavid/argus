import { ChevronDown } from 'lucide-react';

export const TelecomAssetList = () => {

    const itemsList = [
        'ARP',
        'OPCUA',
        '104',
      ];

    return (
    <div className="p-2">
        {itemsList.map((effect, index) => (
        <div key={index} className="flex items-center space-x-2 p-1 hover:bg-gray-700 cursor-pointer">
            <ChevronDown className="w-4 h-4" />
            <span className="text-sm">{effect}</span>
        </div>
        ))}
    </div>
    );

}