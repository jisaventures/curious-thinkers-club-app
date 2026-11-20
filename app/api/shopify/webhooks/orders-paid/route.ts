import { NextResponse } from "next/server";
import { demoApplyOrder } from "@/lib/demo/handlers";
import { isDemoMode } from "@/lib/demo/mode";
import { createAdminClient } from "@/lib/supabase/admin";
import { shopifyConfig } from "@/lib/env";
import { verifyShopifyHmac } from "@/lib/shopify/hmac";
import { orderEmail, orderPaidSchema, orderProductIds } from "@/lib/shopify/orders";

/**
 * Shopify orders/paid webhook.
 * TODO(shopify-custom-app): point the custom app's orders/paid subscription at
 * https://<club-host>/api/shopify/webhooks/orders-paid and set SHOPIFY_WEBHOOK_SECRET
 * to the app's API secret. Unsigned requests are rejected. This route does not
 * call Shopify.
 */
export async function POST(request: Request) {
  const secret = shopifyConfig().webhookSecret;
  const raw = await request.text();
  if (!secret) {
    return NextResponse.json({ error: "Shopify webhook secret is not configured." }, { status: 503 });
  }
  const header = request.headers.get("x-shopify-hmac-sha256");
  if (!verifyShopifyHmac(raw, header, secret)) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = orderPaidSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Unexpected order payload." }, { status: 400 });
  }

  const order = parsed.data;
  const email = orderEmail(order);
  const customerId = order.customer?.id ? String(order.customer.id) : null;
  const productIds = orderProductIds(order);
  if (isDemoMode()) {
    return NextResponse.json(
      demoApplyOrder({ email, customerId, productIds, orderId: String(order.id) }),
    );
  }
  const admin = createAdminClient();

  if (productIds.length === 0) {
    await admin.from("shopify_events").insert({
      shopify_order_id: String(order.id),
      email: email || null,
      shopify_customer_id: customerId,
      product_ids: [],
      status: "no_products",
    });
    return NextResponse.json({ ok: true, granted: 0, reason: "no_products" });
  }

  const { data: packs } = await admin.from("packs").select("id, shopify_product_id").in("shopify_product_id", productIds);
  const matched = packs ?? [];
  if (matched.length === 0) {
    await admin.from("shopify_events").insert({
      shopify_order_id: String(order.id),
      email: email || null,
      shopify_customer_id: customerId,
      product_ids: productIds,
      status: "no_products",
      detail: "No pack uses these product ids yet.",
    });
    return NextResponse.json({ ok: true, granted: 0, reason: "no_matching_packs" });
  }

  let account: { id: string; shopify_customer_id: string | null } | null = null;
  if (customerId) {
    const { data } = await admin
      .from("accounts")
      .select("id, shopify_customer_id")
      .eq("shopify_customer_id", customerId)
      .maybeSingle();
    account = data;
  }
  if (!account && email) {
    const { data } = await admin
      .from("accounts")
      .select("id, shopify_customer_id")
      .ilike("email", email)
      .maybeSingle();
    account = data;
  }

  if (!account) {
    await admin.from("shopify_events").insert({
      shopify_order_id: String(order.id),
      email: email || null,
      shopify_customer_id: customerId,
      product_ids: productIds,
      status: "unmatched",
      detail: "No club account with this email yet.",
    });
    return NextResponse.json({ ok: true, granted: 0, reason: "account_not_linked" });
  }

  if (customerId && !account.shopify_customer_id) {
    await admin.from("accounts").update({ shopify_customer_id: customerId }).eq("id", account.id);
  }

  const rows = matched.map((pack) => ({
    account_id: account.id,
    pack_id: pack.id,
    source: "shopify_webhook" as const,
    shopify_order_id: String(order.id),
  }));
  const { error } = await admin.from("pack_ownership").upsert(rows, {
    onConflict: "account_id,pack_id",
    ignoreDuplicates: true,
  });
  if (error) {
    return NextResponse.json({ error: "Could not grant packs." }, { status: 500 });
  }

  await admin.from("shopify_events").insert({
    shopify_order_id: String(order.id),
    email: email || null,
    shopify_customer_id: customerId,
    product_ids: productIds,
    status: "granted",
    detail: `Granted ${matched.length} pack${matched.length === 1 ? "" : "s"}.`,
  });

  return NextResponse.json({ ok: true, granted: matched.length });
}
