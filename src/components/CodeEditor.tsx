import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { Play, Download, Upload } from "lucide-react";
import { useSocket } from "../hooks/useSocket";

const languageOptions = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
];

export const CodeEditor = () => {
  const [localCode, setLocalCode] = useState<string>("// Start coding here\n");
  const [localLanguage, setLocalLanguage] = useState<string>("javascript");
  const [isUploading, setIsUploading] = useState(false);
  const { sendCodeUpdate, receiveCodeUpdate } = useSocket();

  // Listen for remote updates
  useEffect(() => {
    receiveCodeUpdate((update) => {
      setLocalCode(update.code);
      setLocalLanguage(update.language);
    });
  }, [receiveCodeUpdate]);

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newLanguage = event.target.value;
    setLocalLanguage(newLanguage);
    sendCodeUpdate(localCode, newLanguage);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setLocalCode(value);
      sendCodeUpdate(value, localLanguage);
    }
  };

  const downloadCode = () => {
    const blob = new Blob([localCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code.${localLanguage}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const content = await file.text();
        setLocalCode(content);
        sendCodeUpdate(content, localLanguage);
      } catch (error) {
        console.error("Error reading file:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full flex flex-col">
      <div className="p-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <select
            value={localLanguage}
            onChange={handleLanguageChange}
            className="px-2 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex space-x-1">
            <label
              className={`cursor-pointer p-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors ${
                isUploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <Upload size={16} />
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".js,.ts,.py,.java,.cpp,.cs,.html,.css,.txt"
                disabled={isUploading}
              />
            </label>
            <button
              onClick={downloadCode}
              className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"
              title="Download Code"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          language={localLanguage}
          value={localCode}
          onChange={handleCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
};
