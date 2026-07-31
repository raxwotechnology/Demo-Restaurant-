// Central API base URL configuration
const getApiBaseUrl = () => {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5000";
  }
  return process.env.REACT_APP_API_BASE_URL || "https://demo-restaurant-8ntz.onrender.com";
};

const API_BASE_URL = getApiBaseUrl();

export default API_BASE_URL;

