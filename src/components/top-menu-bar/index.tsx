export const TopMenuBar = () => {

    const items = [
        'File', 'Edit', 'View', 'Project', 'Monitor', 'Settings', 'Help'
    ];

    const debugs = [
        'Logging', 'Editing',
    ]

    return (
        <div className="flex items-center justify-between p-1 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-4">
          {items.map(menu => (
            <button key={menu} className="text-sm hover:text-white">{menu}</button>
          ))}
        </div>
        <div className="flex space-x-4">
            {debugs.map(menu => (
                <span key={menu} className="text-sm">{menu}</span>
            ))}
        </div>
      </div>
    )
}