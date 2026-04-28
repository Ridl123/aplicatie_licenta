import axios from "axios";

// Creăm o instanță de Axios cu setările de bază
const api = axios.create({
  baseURL:
    //"https://licenta-dug2g5c4anaxgke3.germanywestcentral-01.azurewebsites.net/api",
    "https://localhost:7293/api",
});

// INTERCEPTOR PENTRU REQUEST-URI
api.interceptors.request.use(
  (config) => {
    // Căutăm token-ul în locația de stocare
    const token = localStorage.getItem("token");

    // Dacă există, îl lipim în header-ul de autorizare
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// INTERCEPTOR PENTRU RESPONSE-URI
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Dacă backend-ul ne întoarce 401 (Unauthorized) înseamnă că token-ul a expirat sau e invalid
    if (error.response && error.response.status === 401) {
      console.warn("Token expirat. Vă rugăm să vă reconectați.");
      localStorage.removeItem("token");
      localStorage.removeItem("role");

      // Forțăm redirecționarea la login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
