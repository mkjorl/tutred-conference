import React from 'react';
import { Trash2, FileText } from 'lucide-react';
import { useNotesStore } from '../stores/notesStore';

export const Notes = () => {
  const { notes, deleteNote } = useNotesStore();

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {notes.map((note) => (
          <div
            key={note.id}
            className="bg-gray-50 rounded-lg p-3 shadow-sm border"
          >
            {note.type === 'image' ? (
              <div className="space-y-2">
                <img
                  src={note.content}
                  alt="Whiteboard capture"
                  className="w-full rounded-lg border"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                  onContextMenu={(e) => e.preventDefault()}
                />
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap">{note.content}</p>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
            <div className="mt-2 text-xs text-gray-500">
              {new Date(note.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};