import { useState } from "react";

export const TelecomPreview = () => {

    const [currentTime, _] = useState('00:02:21:03');


    return (
        <div className="flex-1 m-2 relative">
            <div className="h-full bg-black rounded">
            <img src="/api/placeholder/640/360" alt="telecom preview" className="w-full h-full object-contain" />
            <div className="absolute bottom-0 left-0 right-0 bg-orange-500 h-12 opacity-30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center">
                <span className="text-xs">25.00fps</span>
                <span className="text-xs">{currentTime}</span>
            </div>
            </div>
        </div>
    );
}