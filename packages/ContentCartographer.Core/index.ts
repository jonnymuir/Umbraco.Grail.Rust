/**
 * Content Cartographer - Main Entry Point
 * Exports all types and components for use in property editors
 */

// Export types
export * from './types/cartographer';

// Export Lit web component (registers as <content-cartographer>)
export { ContentCartographer } from './src/components/content-cartographer';

// WASM loader helper
export async function initializeCartographer() {
  try {
    // Load WASM from /wasm/ directory
    const cartographerWasm = await import('/wasm/grail_core.js');
    return cartographerWasm;
  } catch (error) {
    console.error('Failed to initialize Cartographer WASM module:', error);
    throw error;
  }
}

export const DEFAULT_CONFIG = {
  showDepth: 3,
  visualizationMode: 'force-directed',
  highlightRelationships: ['depends_on', 'uses_media', 'tagged_with', 'references'],
  enableImpactAnalysis: true,
  enableExport: true,
  physics: { temperature: 100, cooling: 0.1, iterations: 100 },
};

export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@umbraco-grail/content-cartographer';
