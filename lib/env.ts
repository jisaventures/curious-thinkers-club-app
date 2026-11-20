export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
};

export function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
}

export function supabaseAnonKey() {
  return process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
}

export function siteUrl() {
  return (process.env.SITE_URL || "http://127.0.0.1:43123").replace(/\/$/, "");
}

export function shopUrl() {
  return process.env.NEXT_PUBLIC_SHOP_URL || "https://curiousthinkersclub.org";
}

export function demoLoginEnabled() {
  return process.env.DEV_DEMO_LOGIN === "true";
}

export function shopifyConfig() {
  return {
    domain: process.env.SHOPIFY_SHOP_DOMAIN || "",
    clientId: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID || "",
    clientSecret: process.env.SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET || "",
    issuer: process.env.SHOPIFY_CUSTOMER_ACCOUNT_ISSUER || "",
    webhookSecret: process.env.SHOPIFY_WEBHOOK_SECRET || "",
  };
}

export function authProvider() {
  return process.env.AUTH_PROVIDER === "shopify" ? "shopify" : "supabase";
}
