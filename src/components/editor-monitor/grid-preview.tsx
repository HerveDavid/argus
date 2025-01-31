import { useState } from "react";
import SVGViewer from "./drag";

export const GridPreview = () => {

    const [currentTime, _] = useState('00:02:21:03');


    return (
        <div className="flex-1 m-2 relative">
            <div className="h-full bg-slate-200">
            <SVGViewer></SVGViewer>
            <div className="absolute bottom-0 left-0 right-0 bg-cyan-500 h-12 opacity-30"></div>
            <div className="absolute bottom-0 left-0 right-0 p-2 flex justify-between items-center">
                <span className="text-xs text-black">25.00fps</span>
                <span className="text-xs text-black">{currentTime}</span>
            </div>
            </div>
        </div>
    );
}