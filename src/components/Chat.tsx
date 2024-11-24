import React, { useState, useRef } from 'react';
import { Send, Paperclip, FileText, Image, Film, X, MessageSquare, BrainCircuit, Notebook, FileText as Transcript } from 'lucide-react';
import { useChatStore } from '../stores/chatStore';
import { useAIStore } from '../stores/aiStore';
import { AIAssistant } from './AIAssistant';
import { TranscriptionView } from './TranscriptionView';
import { Notes } from './Notes';

export const Chat = () => {
  const [message, setMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { messages, sendMessage } = useChatStore();
  const { isEnabled: isAIEnabled, toggleAI, unreadCount } = useAIStore();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    let attachment;
    if (selectedFile) {
      attachment = {
        id: Date.now().toString(),
        name: selectedFile.name,
        url: URL.createObjectURL(selectedFile),
        type: selectedFile.type,
        size: selectedFile.size,
      };
    }

    sendMessage({
      id: Date.now(),
      text: message,
      sender: 'You',
      timestamp: new Date().toISOString(),
      attachment,
    });

    setMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    if (type.startsWith('video/')) return <Film size={16} />;
    return <FileText size={16} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className={`flex flex-col h-full bg-white rounded-lg shadow-lg ${
        isDragging ? 'border-2 border-dashed border-blue-500' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="p-2 border-b">
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => {
              setShowNotes(false);
              setShowTranscript(false);
              toggleAI(false);
            }}
            className={`p-2.5 rounded-lg transition-colors group relative ${
              !isAIEnabled && !showNotes && !showTranscript
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Chat"
          >
            <MessageSquare size={20} />
          </button>
          
          <button
            onClick={() => {
              setShowNotes(false);
              setShowTranscript(false);
              toggleAI();
            }}
            className={`p-2.5 rounded-lg transition-colors group relative ${
              isAIEnabled
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="AI Assistant"
          >
            <div className="relative">
              <BrainCircuit size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => {
              setShowTranscript(true);
              setShowNotes(false);
              toggleAI(false);
            }}
            className={`p-2.5 rounded-lg transition-colors group relative ${
              showTranscript
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Transcript"
          >
            <Transcript size={20} />
          </button>

          <button
            onClick={() => {
              setShowNotes(true);
              setShowTranscript(false);
              toggleAI(false);
            }}
            className={`p-2.5 rounded-lg transition-colors group relative ${
              showNotes
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title="Notes"
          >
            <Notebook size={20} />
          </button>
        </div>
      </div>
      
      {isAIEnabled ? (
        <AIAssistant />
      ) : showNotes ? (
        <Notes />
      ) : showTranscript ? (
        <TranscriptionView />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'You' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-2 ${
                    msg.sender === 'You'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm font-semibold">{msg.sender}</p>
                  {msg.text && <p className="text-sm">{msg.text}</p>}
                  {msg.attachment && (
                    <div className="mt-2 p-2 bg-white/10 rounded flex items-center space-x-2">
                      {getFileIcon(msg.attachment.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{msg.attachment.name}</p>
                        <p className="text-xs opacity-75">
                          {formatFileSize(msg.attachment.size)}
                        </p>
                      </div>
                      <a
                        href={msg.attachment.url}
                        download={msg.attachment.name}
                        className="text-xs underline hover:no-underline"
                      >
                        Download
                      </a>
                    </div>
                  )}
                  <p className="text-xs opacity-75 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedFile && (
            <div className="px-2 py-1 border-t bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getFileIcon(selectedFile.type)}
                <span className="text-sm truncate">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({formatFileSize(selectedFile.size)})
                </span>
              </div>
              <button
                onClick={clearSelectedFile}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X size={16} />
              </button>
            </div>
          )}
          
          <div className="p-2 border-t">
            <div className="flex space-x-2">
              <label className="p-1.5 hover:bg-gray-100 rounded cursor-pointer">
                <Paperclip size={18} />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSend}
                className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};