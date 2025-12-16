// src/utils/dataFixer.js
export const dataFixer = {
  ensureArray(data) {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results && Array.isArray(data.results)) return data.results;
    if (data.data && Array.isArray(data.data)) return data.data;
    return [];
  },
  
  ensureObject(data) {
    if (!data) return {};
    if (typeof data === 'object' && !Array.isArray(data)) return data;
    return {};
  },
  
  safeFilter(array, callback) {
    if (!Array.isArray(array)) return [];
    try {
      return array.filter(callback);
    } catch {
      return [];
    }
  },
  
  safeReduce(array, callback, initialValue) {
    if (!Array.isArray(array)) return initialValue;
    try {
      return array.reduce(callback, initialValue);
    } catch {
      return initialValue;
    }
  }
};