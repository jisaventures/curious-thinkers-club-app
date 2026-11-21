import { shopifyConfig } from "@/lib/env";
import { displayNameSchema } from "@/lib/validators";

/**
 * TODO(shopify-customer-account-api):
 * Replace email magic links with Shopify Customer Account API OAuth so an
 * adult who is already signed in on the shop is signed in here as well.
 *
 * Do not call a real shop from v1. When Josh connects the custom app, set:
 *   AUTH_PROVIDER=shopify
 *   SHOPIFY_SHOP_DOMAIN
 *   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID
 *   SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_SECRET   (server only)
 *   SHOPIFY_CUSTOMER_ACCOUNT_ISSUER          (https://shopify.com/authentication/<shop_id>)
 *
 * Planned server-side flow:
 * 1. Redirect the adult to the Customer Account authorization endpoint.
 * 2. Exchange the authorization code on the server. The client secret never
 *    reaches the browser.
 * 3. Read the Shopify customer id, the verified email, and the customer's
 *    first name. Onboarding does not ask for that name. It is saved as
 *    accounts.display_name when the shop account is created.
 * 4. Store the customer id on accounts.shopify_customer_id.
 * 5. Issue a Supabase session with auth.admin.generateLink so Row Level
 *    Security stays in Postgres. Do not invent a second session store.
 * 6. Refuse the login when Shopify does not return a verified email.
 */
/** First name already stored from Shopify account creation, when it is a real given name. */
const SHOP_COUNTRIES: Record<string, string> = {
  GB: "United Kingdom",
  UK: "United Kingdom",
  "UNITED KINGDOM": "United Kingdom",
  "GREAT BRITAIN": "United Kingdom",
  US: "United States",
  USA: "United States",
  "UNITED STATES": "United States",
  IE: "Ireland",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  AU: "Australia",
  CA: "Canada",
  NZ: "New Zealand",
};

/** Country from a Shopify invoice address. A UK billing country becomes United Kingdom. */
export function locationFromShopifyAddress(country: string | null | undefined) {
  const raw = country?.trim() ?? "";
  if (!raw) return "United Kingdom";
  return SHOP_COUNTRIES[raw.toUpperCase()] ?? raw;
}

export function firstNameFromShopAccount(displayName: string | null | undefined) {
  const name = displayName?.trim() ?? "";
  return displayNameSchema.safeParse(name).success ? name : null;
}

export async function startShopifyCustomerLogin() {
  const config = shopifyConfig();
  if (!config.domain || !config.clientId || !config.clientSecret || !config.issuer) {
    return {
      ok: false as const,
      message:
        "Shop sign-in is not connected yet. Use the email link, or ask Josh to add the Shopify Customer Account API keys.",
    };
  }

  return {
    ok: false as const,
    message:
      "The Shopify Customer Account API keys are present, but the OAuth exchange is still a stub in v1. Use the email link for now.",
  };
}
