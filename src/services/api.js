import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000" });

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const res = await axios.post("/refresh_token", {}, { withCredentials: true });
      localStorage.setItem("accessToken", res.data.accessToken);
      originalRequest.headers["Authorization"] = "Bearer " + res.data.accessToken;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);

export default api;
