"use client";

import { useMutation } from "@liveblocks/react";
import { ReactNode } from "react";

const LayerButton = ({
  layerId,
  text,
  icon,
  isSelected,
}: {
  layerId: string;
  text: string;
  icon: ReactNode;
  isSelected: boolean;
}) => {
  const updateSelection = useMutation(({ setMyPresence }, layerId: string) => {
    setMyPresence({ selection: [layerId] }, { addToHistory: true });
  }, []);

  return (
    <button
      className={`
        group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm
        transition-all duration-150 w-full
        ${
          isSelected
            ? "bg-blue-100 border border-blue-300 shadow-sm"
            : "bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300"
        }
      `}
      onClick={() => updateSelection(layerId)}
    >
      <div className={`flex-shrink-0 ${isSelected ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"}`}>
        {icon}
      </div>
      <span className={`truncate font-medium ${isSelected ? "text-blue-900" : "text-gray-700"}`}>
        {text}
      </span>
      {isSelected && (
        <div className="ml-auto flex-shrink-0 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
};

export default LayerButton;
