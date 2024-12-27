// api/auth.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const handleApiResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'An error occurred');
  }
  return data;
};

export const authAPI = {
  login: async (email, password) => {
    try {
      const formData = new FormData();
      formData.append('username', email); // FastAPI OAuth expects 'username' for email
      formData.append('password', password);

      console.log('API URL:', `${API_BASE_URL}/auth/token`); // Log full URL

      const response = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        body: formData,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
          },
      });

      const data = await handleApiResponse(response);
      await AsyncStorage.setItem('access_token', data.access_token);
      return data;
    } catch (error) {
      throw error;
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      });

      return await handleApiResponse(response);
    } catch (error) {
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      await AsyncStorage.removeItem('access_token');
      return await handleApiResponse(response);
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return await handleApiResponse(response);
    } catch (error) {
      throw error;
    }
  },

  confirmResetPassword: async (token, new_password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          new_password,
        }),
      });

      return await handleApiResponse(response);
    } catch (error) {
      throw error;
    }
  },
};