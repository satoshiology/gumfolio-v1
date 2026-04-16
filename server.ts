import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GUMROAD_CLIENT_ID = process.env.GUMROAD_CLIENT_ID || "v_Nr8bJla9JNCjswGZtDf3GuSKAIG651aCwULJq8GvE";
const GUMROAD_CLIENT_SECRET = process.env.GUMROAD_CLIENT_SECRET || "iQqr7wwT91t2-FWyv7VzzecuCKqafEk750JEmTANPPo";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const GUMROAD_API_BASE = "https://api.gumroad.com/v2";

  // The user specifically requested this exact redirect URI
  const EXACT_REDIRECT_URI = "https://gumfolio-v2-520825105178.us-west1.run.app";

  // OAuth Routes
  app.get("/api/auth/url", (req, res) => {
    const params = new URLSearchParams({
      client_id: GUMROAD_CLIENT_ID,
      redirect_uri: EXACT_REDIRECT_URI,
      response_type: "code",
      scope: "account view_profile edit_products view_sales view_payouts mark_sales_as_shipped edit_sales",
    });

    const authUrl = `https://gumroad.com/oauth/authorize?${params.toString()}`;
    res.json({ url: authUrl });
  });

  const handleOAuthCallback = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const { code } = req.query;
    if (!code) {
      return next();
    }

    try {
      // Gumroad expects form-urlencoded data, matching the cURL --data flags
      const tokenParams = new URLSearchParams({
        client_id: GUMROAD_CLIENT_ID,
        client_secret: GUMROAD_CLIENT_SECRET,
        code: code as string,
        redirect_uri: EXACT_REDIRECT_URI,
      });

      const response = await axios.post("https://api.gumroad.com/oauth/token", tokenParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token } = response.data;

      res.send(`
        <html>
          <body>
            <script type='text/javascript' nonce='Zb1rCQAlF07XZOfC6v8E+A==' src='https://aistudio.google.com/SpaeBV7yCg0tUqkKv_Uxs0Q0ssOfT89XwFDsSm0q418vnZXjigyc7YshZ3HROatWRZ_7_I6W8WPSoeDGUg2qaOOEbaPsgEx90UUUtrAblH_hVkl6x8jeU2A6rQtw3gJ0X30kTgk5hArSmbK8JEQMM--Hacr-f7OMFi6fR6Uiq4cQtCpEaUMOYJmFKO4LVdWNEMPBW0J-gFxgnvKkom59OAreJGF-P-pDLT4gBuB4fp-7l7mVY4d4dj816e1kRDgtthX0YtyOPjbgLQBGh4GVzf50JrCMS5wQO4fAhFYdHSIns7YF_4tq2fVls0cTq4J7bs0M35ewNRujCMHRKh-SYvzDMby7GTMKB14X4E3Xm3bJN-UpDQRi06_CkMba0zkFXEGTa53Vue-DI-VUTni0dzCUVgheaJS04fyiLis0TBC4IQNTgNNqYHFdLlNVEecX1lZ_NdSISjcdqwo_N1ay_tp49_GdPG1O3j6QWJUYAEX3q3w0OwA2f-l7mfhl-CH8-UKGdMD1i_z71cbKS_YXjDfgqNMF_qluvxNnnV-_JhxSc1vzM61vI5AlLhTKxckzWvv-XiGOrFz_ZAhgasu2RoIV9EgXYQjLN6QhOa5qOZ8DtEl_Dw'></script><script>
              // 1. Save token to localStorage so the main window can detect it
              try {
                localStorage.setItem('gumroad_access_token', '${access_token}');
              } catch (e) {
                console.error('localStorage error:', e);
              }

              // 2. Try postMessage as a secondary method
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', token: '${access_token}' }, '*');
              }

              // 3. Attempt to close the popup
              window.close();

              // 4. Fallback: if the window refuses to close, redirect to the app
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
            </script>
            <p>Authentication successful. This window should close automatically...</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("OAuth Token Exchange Error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed. Please try again.");
    }
  };

  app.get(["/auth/callback", "/auth/callback/"], handleOAuthCallback);
  app.get("/", handleOAuthCallback);

  // API Routes
  app.get("/api/products", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res.status(401).json({ error: "Gumroad Access Token not provided" });
      }
      const response = await axios.get(`${GUMROAD_API_BASE}/products`, {
        params: { access_token: accessToken },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad Products Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch products" });
    }
  });

  app.get("/api/sales", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res.status(401).json({ error: "Gumroad Access Token not provided" });
      }
      const response = await axios.get(`${GUMROAD_API_BASE}/sales`, {
        params: { access_token: accessToken },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad Sales Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch sales" });
    }
  });

  app.get("/api/user", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res.status(401).json({ error: "Gumroad Access Token not provided" });
      }
      const response = await axios.get(`${GUMROAD_API_BASE}/user`, {
        params: { access_token: accessToken },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad User Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch user" });
    }
  });

  app.get("/api/payouts", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) {
        return res.status(401).json({ error: "Gumroad Access Token not provided" });
      }
      const response = await axios.get(`${GUMROAD_API_BASE}/payouts`, {
        params: { access_token: accessToken },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad Payouts Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to fetch payouts" });
    }
  });

  // Action Routes
  app.put("/api/sales/:id/refund", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const { amount_cents } = req.body;
      const data: any = { access_token: accessToken };
      if (amount_cents) data.amount_cents = amount_cents;

      const response = await axios.put(`${GUMROAD_API_BASE}/sales/${req.params.id}/refund`, data);
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to refund sale" });
    }
  });

  app.post("/api/sales/:id/resend_receipt", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.post(`${GUMROAD_API_BASE}/sales/${req.params.id}/resend_receipt`, {
        access_token: accessToken
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to resend receipt" });
    }
  });

  app.put("/api/sales/:id/mark_as_shipped", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const { tracking_url } = req.body;
      const data: any = { access_token: accessToken };
      if (tracking_url) data.tracking_url = tracking_url;

      const response = await axios.put(`${GUMROAD_API_BASE}/sales/${req.params.id}/mark_as_shipped`, data);
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to mark as shipped" });
    }
  });

  app.put("/api/products/:id/enable", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.put(`${GUMROAD_API_BASE}/products/${req.params.id}/enable`, {
        access_token: accessToken
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to enable product" });
    }
  });

  app.put("/api/products/:id/disable", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.put(`${GUMROAD_API_BASE}/products/${req.params.id}/disable`, {
        access_token: accessToken
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to disable product" });
    }
  });

  app.post("/api/verify-license", async (req, res) => {
    const { product_id, license_key } = req.body;
    try {
      const response = await axios.post(`${GUMROAD_API_BASE}/licenses/verify`, {
        product_id,
        license_key,
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad License Verify Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to verify license" });
    }
  });

  app.post("/api/licenses/:license_key/enable", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.post(`${GUMROAD_API_BASE}/licenses/enable`, {
        access_token: accessToken,
        license_key: req.params.license_key,
        product_id: req.body.product_id
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to enable license" });
    }
  });

  app.post("/api/licenses/:license_key/disable", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.post(`${GUMROAD_API_BASE}/licenses/disable`, {
        access_token: accessToken,
        license_key: req.params.license_key,
        product_id: req.body.product_id
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to disable license" });
    }
  });

  app.post("/api/licenses/:license_key/decrement_uses", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      console.log("Decrementing uses for:", req.params.license_key, "Product ID:", req.body.product_id);
      const response = await axios.post(`${GUMROAD_API_BASE}/licenses/decrement_uses`, {
        access_token: accessToken,
        license_key: req.params.license_key,
        product_id: req.body.product_id
      });
      console.log("Gumroad response:", response.data);
      res.json(response.data);
    } catch (error: any) {
      console.error("Gumroad Decrement Error:", error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to decrement uses" });
    }
  });

  app.post("/api/licenses/:license_key/rotate", async (req, res) => {
    try {
      const accessToken = req.headers.authorization?.split(" ")[1];
      if (!accessToken) return res.status(401).json({ error: "Unauthorized" });
      
      const response = await axios.post(`${GUMROAD_API_BASE}/licenses/rotate`, {
        access_token: accessToken,
        license_key: req.params.license_key,
        product_id: req.body.product_id
      });
      res.json(response.data);
    } catch (error: any) {
      res.status(error.response?.status || 500).json(error.response?.data || { error: "Failed to rotate license" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
