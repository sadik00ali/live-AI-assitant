let API_URL = "http://localhost:5000/"; // ✅ default for local development

// ✅ If your frontend is running on Dev Tunnel, switch to Flask tunnel
if (window.location.hostname.includes("devtunnels.ms")) {
  API_URL = "https://pgft2cjx-5000.inc1.devtunnels.ms/"; // replace with your Flask tunnel URL
}

export default API_URL;
