// @/lib/client/api.ts

import axios, { AxiosRequestConfig, AxiosError } from 'axios';
import { getAppCheckToken } from './firebase-app-check';
import { getAuth } from 'firebase/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const APP_ID = process.env.NEXT_PUBLIC_APP_ID || 'web-client'; // 'web-client' ou 'mobile-client'

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
    timestamp: string;
  };
  [key: string]: any;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;
  private appCheckToken: string | null = null;
  private tokenExpiry: number = 0;
  private appCheckTokenExpiry: number = 0;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string) {
    this.token = token;
    // Stocker l'expiration du token (1 heure par défaut pour Firebase)
    this.tokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
  }

  public clearToken() {
    this.token = null;
    this.tokenExpiry = 0;
  }

  private async getValidToken(): Promise<string | null> {
  if (!this.token || Date.now() >= this.tokenExpiry) {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      try {
        // Pas besoin de forceRefresh=true, Firebase refresh automatiquement
        const newToken = await user.getIdToken();
        this.setToken(newToken);
        return newToken;
      } catch (error) {
        console.error('Erreur rafraîchissement token:', error);
        
        // Si l'erreur est due à un token révoqué, déconnecter l'utilisateur
        if (error instanceof Error && error.message.includes('token revoked')) {
          await auth.signOut();
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        return null;
      }
    }
    return null;
  }
  return this.token;
}

  private async getValidAppCheckToken(): Promise<string | null> {
    // App Check token expire après 1 heure
    if (!this.appCheckToken || Date.now() >= this.appCheckTokenExpiry) {
      try {
        const token = await getAppCheckToken();
        this.appCheckToken = token;
        this.appCheckTokenExpiry = Date.now() + 55 * 60 * 1000; // 55 minutes
        return token;
      } catch (error) {
        console.error('Erreur rafraîchissement App Check token:', error);
        return null;
      }
    }
    return this.appCheckToken;
  }

  private async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const isFormData = config.data instanceof FormData;
      
      // Récupérer les tokens
      const [authToken, appCheckToken] = await Promise.all([
        this.getValidToken(),
        this.getValidAppCheckToken()
      ]);

      const headers: Record<string, string> = {
        'x-app-id': APP_ID,
        ...(config.headers as Record<string, string>),
      };

      // Ajouter le token d'authentification si disponible
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      // Ajouter le token App Check si disponible
      if (appCheckToken) {
        headers['X-Firebase-AppCheck'] = appCheckToken;
      }

      if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const fullUrl = config.url?.startsWith('/api')
        ? config.url
        : `${API_BASE_URL}${config.url}`;

      const response = await axios({
        baseURL: config.url?.startsWith('/api') ? undefined : API_BASE_URL,
        ...config,
        url: fullUrl,
        headers,
        timeout: 30000, // 30 secondes timeout
      });

      // Gérer la structure de réponse standardisée
      const apiResponse = response.data as ApiResponse<T>;
      
      if (apiResponse.success === false && apiResponse.error) {
        throw new Error(apiResponse.error.message || 'Erreur API');
      }
      
      if (apiResponse.data !== undefined) {
        return apiResponse.data;
      }
      
      return response.data as T;
      
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiResponse>;
        
        if (!axiosError.response) {
          throw new Error('Erreur réseau: serveur inaccessible');
        }

        // Extraire le message d'erreur de la réponse
        const errorData = axiosError.response.data;
        const errorMessage = errorData?.error?.message || 
                           errorData?.message || 
                           axiosError.response.statusText || 
                           `Erreur ${axiosError.response.status}`;
        
        // Gérer les erreurs d'authentification
        if (axiosError.response.status === 401) {
          this.clearToken();
          // Déclencher un événement de déconnexion
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        
        throw new Error(errorMessage);
      }

      throw new Error(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'GET', url, ...config });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'POST', url, data, ...config });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data, ...config });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'DELETE', url, ...config });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data, ...config });
  }
}

export const api = ApiService.getInstance();

// Écouter les événements de déconnexion
if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    // Rediriger vers la page de connexion ou déclencher une déconnexion
    const auth = getAuth();
    auth.signOut();
  });
}