import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

// Define user type
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  subAccountId?: number | null;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  error: null,
  login: async () => {
    throw new Error('Not implemented');
  },
  logout: async () => {
    throw new Error('Not implemented');
  },
});

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<Error | null>(null);

  // User data query
  const { 
    data: user, 
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Login function
  const login = async (username: string, password: string): Promise<User> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const userData = await response.json();
      await refetch(); // Update the user data after login
      return userData;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Logout failed');
      }

      await refetch(); // Update the user data after logout
    } catch (err: any) {
      setError(err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => useContext(AuthContext);