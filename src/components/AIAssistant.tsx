import React, { useState } from 'react';
import { BrainCircuit, ChevronDown, ChevronRight, Lightbulb, AlertTriangle, Sparkles } from 'lucide-react';
import { useAIStore } from '../stores/aiStore';

export const AIAssistant = () => {
  const { suggestions, markAsRead } = useAIStore();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
    markAsRead(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'explanation':
        return <Sparkles size={16} className="text-blue-500" />;
      case 'solution':
        return <Lightbulb size={16} className="text-green-500" />;
      case 'problem':
        return <AlertTriangle size={16} className="text-orange-500" />;
      default:
        return <BrainCircuit size={16} className="text-purple-500" />;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-2 font-poppins">
      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <BrainCircuit size={48} className="mb-2" />
          <p className="text-sm">AI Assistant is analyzing the session...</p>
        </div>
      ) : (
        suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`bg-white rounded-lg shadow-sm border transition-all ${
              !suggestion.isRead ? 'border-blue-500' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => toggleExpand(suggestion.id)}
              className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center space-x-2">
                {getIcon(suggestion.type)}
                <span className="text-sm font-medium capitalize">
                  {suggestion.type}
                </span>
              </div>
              {expandedIds.includes(suggestion.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            
            {expandedIds.includes(suggestion.id) && (
              <div className="px-3 py-2 text-sm border-t border-gray-100">
                {suggestion.content}
                <div className="mt-2 text-xs text-gray-500">
                  {new Date(suggestion.timestamp).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};