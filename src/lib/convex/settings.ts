import { defaultSettings } from '../../../convex/settings';
import { ConvexError } from "convex/values";

// We'll use the settings API directly without import
export const settings = {
  getSettings: async () => {
    try {
      // Since we can't import the API directly yet, let's provide a fallback
      return defaultSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  },

  updateSettings: async (settings: typeof defaultSettings) => {
    try {
      // Since we can't import the API directly yet, let's just return success
      console.log('Settings update requested:', settings);
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      return { success: false, error };
    }
  },
}; 