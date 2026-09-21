const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export async function fetchNodes() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/nodes`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('[API] Could not fetch initial nodes from backend:', error.message);
    return null;
  }
}

export async function fetchNodeHistory(nodeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/nodes/${nodeId}/history`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[API] Could not fetch history for node ${nodeId}:`, error.message);
    return null;
  }
}

export async function fetchAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/alerts`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('[API] Could not fetch alerts:', error.message);
    return null;
  }
}
