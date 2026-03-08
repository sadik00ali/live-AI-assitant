let API_URL = "http://localhost:5000/";

// Expo / React Native DOES NOT support window object
// so we detect environment differently

if (__DEV__) {
  API_URL = "http://172.16.123.132:5000/";
}

export default API_URL;
