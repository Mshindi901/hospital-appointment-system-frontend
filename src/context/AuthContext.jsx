import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('auth_token') || '');
  const [loading, setLoading] = useState(true);

  const restoreSession = () => {
    const savedToken = localStorage.getItem('auth_token');
    const savedUser = localStorage.getItem('auth_user');

    if (savedToken) {
      const decoded = decodeToken(savedToken);

      if (decoded) {
        const persistedUser = savedUser ? JSON.parse(savedUser) : {};
        const nextUser = {
          id: decoded.id,
          role: decoded.role,
          name: persistedUser.name || decoded.name || 'User',
        };

        setUser(nextUser);
        setToken(savedToken);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const login = (newToken) => {
    const decoded = decodeToken(newToken);

    if (!decoded) {
      throw new Error('Invalid token received');
    }

    const nextUser = { id: decoded.id, role: decoded.role, name: decoded.name || 'User' };

    localStorage.setItem('auth_token', newToken);
    localStorage.setItem('auth_user', JSON.stringify(nextUser));

    setToken(newToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken('');
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      loading,
      login,
      logout,
      setUser,
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
