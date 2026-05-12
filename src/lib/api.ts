const API_URL = import.meta.env.VITE_API_URL || "";

export const api = {
  get: async (path: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (path: string, data: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (path: string, data: any) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (path: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_URL}/api${path}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Credenciais inválidas");
    return res.json();
  },
};
