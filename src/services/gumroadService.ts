import axios from "axios";
import { Product, Sale, LicenseVerificationResponse, User, Payout } from "../types";

export const gumroadService = {
  getToken(): string | null {
    return localStorage.getItem("gumroad_access_token");
  },

  setToken(token: string) {
    localStorage.setItem("gumroad_access_token", token);
  },

  clearToken() {
    localStorage.removeItem("gumroad_access_token");
  },

  getHeaders() {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getProducts(): Promise<{ products: Product[] }> {
    const response = await axios.get("/api/products", { headers: this.getHeaders() });
    return response.data;
  },

  async getSales(): Promise<{ sales: Sale[] }> {
    const response = await axios.get("/api/sales", { headers: this.getHeaders() });
    return response.data;
  },

  async getUser(): Promise<{ user: User }> {
    const response = await axios.get("/api/user", { headers: this.getHeaders() });
    return response.data;
  },

  async getPayouts(): Promise<{ payouts: Payout[] }> {
    const response = await axios.get("/api/payouts", { headers: this.getHeaders() });
    return response.data;
  },

  async verifyLicense(productId: string, licenseKey: string, incrementUses: boolean = false): Promise<LicenseVerificationResponse> {
    const response = await axios.post("/api/verify-license", {
      product_id: productId,
      license_key: licenseKey,
      increment_uses: incrementUses
    }, { headers: this.getHeaders() });
    return response.data;
  },

  async enableLicense(productId: string, licenseKey: string): Promise<any> {
    const response = await axios.post(`/api/licenses/${licenseKey}/enable`, { product_id: productId }, { headers: this.getHeaders() });
    return response.data;
  },

  async disableLicense(productId: string, licenseKey: string): Promise<any> {
    const response = await axios.post(`/api/licenses/${licenseKey}/disable`, { product_id: productId }, { headers: this.getHeaders() });
    return response.data;
  },

  async decrementLicenseUses(productId: string, licenseKey: string): Promise<any> {
    const response = await axios.post(`/api/licenses/${licenseKey}/decrement_uses`, { product_id: productId }, { headers: this.getHeaders() });
    return response.data;
  },

  async rotateLicense(productId: string, licenseKey: string): Promise<any> {
    const response = await axios.post(`/api/licenses/${licenseKey}/rotate`, { product_id: productId }, { headers: this.getHeaders() });
    return response.data;
  },

  async disableProduct(productId: string): Promise<any> {
    const response = await axios.put(`/api/products/${productId}`, {
      shown_on_profile: false
    }, { headers: this.getHeaders() });
    return response.data;
  },

  async enableProduct(productId: string): Promise<any> {
    const response = await axios.put(`/api/products/${productId}`, {
      shown_on_profile: true
    }, { headers: this.getHeaders() });
    return response.data;
  },
};
