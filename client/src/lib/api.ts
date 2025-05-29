/**
 * Helper functions for API requests
 */

/**
 * Make an authenticated API request
 * @param method HTTP method (GET, POST, etc.)
 * @param endpoint API endpoint (e.g., /api/users)
 * @param data Request data (for POST, PUT, etc.)
 * @returns Response object
 */
export async function apiRequest(
  method: string, 
  endpoint: string, 
  data?: any
): Promise<Response> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const url = endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;

  return fetch(url, options);
}