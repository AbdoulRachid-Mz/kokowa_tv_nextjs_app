// @/lib/api.ts - VERSION AVEC GESTION D'ERREUR AMÉLIORÉE
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: any;
}

class ApiService {
  private static instance: ApiService;
  private token: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public setToken(token: string) {
    this.token = token;
  }

  public clearToken() {
    this.token = null;
  }

  private async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    try {
      const isFormData = config.data instanceof FormData;

      const headers: Record<string, string> = {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(config.headers as Record<string, string>),
      };

      if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const fullUrl = config.url?.startsWith("/api")
        ? config.url
        : `${API_BASE_URL}${config.url}`;

      const response: AxiosResponse<ApiResponse<T>> = await axios({
        baseURL: config.url?.startsWith("/api") ? undefined : API_BASE_URL,
        ...config,
        url: fullUrl,
        headers,
      });

      // Vérifier si la réponse est une erreur Next.js API
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        throw new Error((response.data as ApiResponse).error || 'Erreur API');
      }

      // Retourner data si présent, sinon l'objet complet
      const apiResponse = response.data as ApiResponse<T>;
      
      if (apiResponse.data !== undefined) {
        return apiResponse.data;
      }
      
      // Pour les réponses qui ne suivent pas la structure { success, data, error }
      return response.data as T;
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new Error("Network Error: serveur inaccessible");
        }

        // Extraire le message d'erreur de la réponse
        const errorData = error.response.data as ApiResponse;
        const errorMessage = errorData?.message || 
                           errorData?.error || 
                           error.response.statusText || 
                           `Erreur ${error.response.status}`;
        
        throw new Error(errorMessage);
      }

      throw new Error(error.message || "Erreur inconnue");
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "GET", url, ...config });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "POST", url, data, ...config });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "DELETE", url, ...config });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.request<T>({ method: "PATCH", url, data, ...config });
  }
}

export const api = ApiService.getInstance();