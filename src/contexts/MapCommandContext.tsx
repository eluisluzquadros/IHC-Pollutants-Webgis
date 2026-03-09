import React, { createContext, useContext, useCallback, useState } from 'react';
import { MapCommand } from '@/services/openaiService';

interface MapCommandContextType {
  executeCommands: (commands: MapCommand[]) => void;
  lastCommand: MapCommand | null;
  commandHistory: MapCommand[];
}

const MapCommandContext = createContext<MapCommandContextType | undefined>(undefined);

export function useMapCommands() {
  const context = useContext(MapCommandContext);
  if (!context) {
    throw new Error('useMapCommands must be used within a MapCommandProvider');
  }
  return context;
}

interface MapCommandProviderProps {
  children: React.ReactNode;
  onExecuteCommands: (commands: MapCommand[]) => void;
}

export function MapCommandProvider({ children, onExecuteCommands }: MapCommandProviderProps) {
  const [lastCommand, setLastCommand] = useState<MapCommand | null>(null);
  const [commandHistory, setCommandHistory] = useState<MapCommand[]>([]);

  const executeCommands = useCallback((commands: MapCommand[]) => {
    console.log('🎯 AI Assistant executing map commands:', commands);
    
    // Track command history
    setCommandHistory(prev => [...prev, ...commands]);
    
    // Set last command for debugging
    if (commands.length > 0) {
      setLastCommand(commands[commands.length - 1]);
    }

    // Execute commands through the parent handler
    onExecuteCommands(commands);
  }, [onExecuteCommands]);

  return (
    <MapCommandContext.Provider 
      value={{ 
        executeCommands, 
        lastCommand, 
        commandHistory 
      }}
    >
      {children}
    </MapCommandContext.Provider>
  );
}