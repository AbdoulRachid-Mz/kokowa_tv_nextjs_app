import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

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

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const isFormData = config.data instanceof FormData;

      const headers: Record<string, string> = {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(config.headers as any),
      };

      if (!isFormData && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }

      const response: AxiosResponse<T> = await axios({
        baseURL: config.url?.startsWith("/api")
          ? undefined
          : API_BASE_URL,
        ...config,
        headers,
      });

      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (!error.response) {
          throw new Error("Network Error: serveur inaccessible");
        }

        throw new Error(
          error.response.data?.message ||
          error.response.data?.error ||
          "Erreur API"
        );
      }

      throw new Error("Erreur inconnue");
    }
  }

  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "GET", url, ...config });
  }

  post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "POST", url, data, ...config });
  }

  put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "PUT", url, data, ...config });
  }

  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "DELETE", url, ...config });
  }

  patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.request<T>({ method: "PATCH", url, data, ...config });
  }
}

export const api = ApiService.getInstance();
