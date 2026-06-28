const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

type RequestBody = Record<string, unknown>;
const REQUEST_TIMEOUT_MS = 15000;

async function parseError(res: Response): Promise<string> {
  try {
    const json = await res.json();
    return json.error || json.message || "Erro desconhecido";
  } catch {
    return "Erro de comunicação com o servidor";
  }
}

function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function buildUrl(path: string) {
  const apiPath = path.startsWith("/api") ? path : `/api${path}`;
  return `${API_URL}${apiPath}`;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("Tempo limite de conexão esgotado. Verifique a URL do backend e a rede.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const api = {
  get: async (path: string) => {
    const res = await fetchWithTimeout(buildUrl(path), {
      headers: authHeaders(),
    });
    if (res.status === 401) {
      logoutAndRedirect();
      throw new Error(await parseError(res));
    }
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  post: async (path: string, data: RequestBody) => {
    const res = await fetchWithTimeout(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      logoutAndRedirect();
      throw new Error(await parseError(res));
    }
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  put: async (path: string, data: RequestBody) => {
    const res = await fetchWithTimeout(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (res.status === 401) {
      logoutAndRedirect();
      throw new Error(await parseError(res));
    }
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  delete: async (path: string) => {
    const res = await fetchWithTimeout(buildUrl(path), {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (res.status === 401) {
      logoutAndRedirect();
      throw new Error(await parseError(res));
    }
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  login: async (credentials: { email: string; password: string }) => {
    const res = await fetchWithTimeout(buildUrl("/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },

  register: async (data: RequestBody) => {
    const res = await fetchWithTimeout(buildUrl("/auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await parseError(res));
    return res.json();
  },
};
