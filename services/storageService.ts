
import { Tool, LendingRecord, Department, LendingStatus } from '../types';
import { INITIAL_TOOLS } from '../constants';

const STORAGE_KEYS = {
  TOOLS: 'smk_inventory_tools',
  LENDING: 'smk_inventory_lending',
  USER: 'smk_inventory_user'
};

export const storageService = {
  // Tools
  getTools: (): Tool[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TOOLS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(INITIAL_TOOLS));
      return INITIAL_TOOLS;
    }
    return JSON.parse(data);
  },

  getToolsByDepartment: (dept: Department): Tool[] => {
    return storageService.getTools().filter(t => t.department === dept);
  },

  saveTool: (tool: Tool) => {
    const tools = storageService.getTools();
    const index = tools.findIndex(t => t.id === tool.id);
    if (index > -1) {
      tools[index] = tool;
    } else {
      tools.push(tool);
    }
    localStorage.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools));
  },

  // Lending
  getLendingRecords: (): LendingRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LENDING);
    return data ? JSON.parse(data) : [];
  },

  saveLendingRecord: (record: LendingRecord) => {
    const records = storageService.getLendingRecords();
    const index = records.findIndex(r => r.id === record.id);
    
    // If updating status, we need to know the previous status to avoid duplicate increments/decrements
    const previousRecord = index > -1 ? records[index] : null;

    if (index > -1) {
      records[index] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.LENDING, JSON.stringify(records));

    // Update available quantity if status changes
    const tools = storageService.getTools();
    const tool = tools.find(t => t.id === record.toolId);
    
    if (tool) {
      // Fix: Only process state transitions once using LendingStatus enum for safety
      if (previousRecord?.status !== LendingStatus.APPROVED && record.status === LendingStatus.APPROVED) {
         tool.availableQuantity = Math.max(0, tool.availableQuantity - record.quantity);
      } else if (previousRecord?.status === LendingStatus.APPROVED && record.status === LendingStatus.RETURNED) {
         tool.availableQuantity = Math.min(tool.quantity, tool.availableQuantity + record.quantity);
      }
      storageService.saveTool(tool);
    }
  },

  deleteLendingRecord: (id: string) => {
    const records = storageService.getLendingRecords();
    const filtered = records.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.LENDING, JSON.stringify(filtered));
  }
};
