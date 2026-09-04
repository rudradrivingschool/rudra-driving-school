/**
 * API Client for Vercel Serverless Functions
 * Provides a simple interface to call backend API endpoints
 */

// Supabase response typed as any — PostgREST does not infer types from service-role queries
/* eslint-disable @typescript-eslint/no-explicit-any */

const API_BASE_URL = import.meta.env.PROD
  ? '' // In production, API routes are at the same domain
  : 'http://localhost:8080'; // In development, use Vite dev server

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}/api/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  // Drivers API
  async getDrivers() {
    return this.request<any[]>('drivers');
  }

  async createDriver(data: any) {
    return this.request<any>('drivers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDriver(id: string, data: any) {
    return this.request<any>(`drivers?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDriver(id: string) {
    return this.request<any>(`drivers?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Admissions API
  async getAdmissions(params?: { id?: string }) {
    const queryString = params?.id ? "?id=" + encodeURIComponent(params.id) : "";
    return this.request<any[]>(`admissions${queryString}`);
  }

  async createAdmission(data: any) {
    return this.request<any>('admissions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAdmission(id: string, data: any) {
    return this.request<any>(`admissions?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAdmission(id: string) {
    return this.request<any>(`admissions?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Rides API
  //
  // Overload 1 – unfiltered: returns the envelope { rides, totalCount } that
  //   api/rides.ts sends when no filter params are present.  Only useRides()
  //   calls this form; it uses totalCount for the "Total Rides" stat.
  //
  // Overload 2 – filtered (client_id / driver_id present): returns the plain
  //   Row[] that every other consumer has always expected.  The API still
  //   returns an array for filtered requests, so no change needed downstream.
  getRides(): Promise<{ rides: any[]; totalCount: number }>;
  getRides(params: { client_id?: string; driver_id?: string }): Promise<any[]>;
  async getRides(params?: { client_id?: string; driver_id?: string }): Promise<any> {
    const queryString = params
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return this.request<any>(`rides${queryString}`);
  }

  async createRide(data: any) {
    return this.request<any>('rides', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRide(id: string, data: any) {
    return this.request<any>(`rides?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRide(id: string) {
    return this.request<any>(`rides?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Expenses API
  async getExpenses() {
    return this.request<any[]>('expenses');
  }

  async createExpense(data: any) {
    return this.request<any>('expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateExpense(id: string, data: any) {
    return this.request<any>(`expenses?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteExpense(id: string) {
    return this.request<any>(`expenses?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Payments API
  async getPayments() {
    return this.request<any[]>('payments');
  }

  async createPayment(data: any) {
    return this.request<any>('payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePayment(id: string, data: any) {
    return this.request<any>(`payments?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePayment(id: string) {
    return this.request<any>(`payments?id=${id}`, {
      method: 'DELETE',
    });
  }

  // Auth API
  async signIn(username: string, password: string) {
    return this.request<{ user: any; message: string }>('auth', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }
}

export const apiClient = new APIClient();
