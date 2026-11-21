import { NextResponse } from "next/server";
import { requireAdult } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDb } from "@/lib/demo/store";
import { shopUrl } from "@/lib/env";

export async function GET() {
  const { user, account } = await requireAdult();
  if (!user || !account) {
    return NextResponse.json({ orders: [] }, { status: 401 });
  }

  const shop = shopUrl().replace(/\/$/, "");
  if (!isDemoMode()) {
    return NextResponse.json({
      orders: [],
      shopAccountUrl: `${shop}/account`,
    });
  }

  const orders = demoDb()
    .orders.filter((order) => order.account_id === account.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((order) => ({
      id: order.id,
      name: order.name,
      createdAt: order.created_at,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      currency: order.currency,
      total: order.total,
      email: order.email,
      shippingCountry: order.shipping_country,
      items: order.items,
      shopUrl: `${shop}/account/orders/${order.id}`,
    }));

  return NextResponse.json({
    orders,
    shopAccountUrl: `${shop}/account`,
  });
}
