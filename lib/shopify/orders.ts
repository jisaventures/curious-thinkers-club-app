import { z } from "zod";

export const orderPaidSchema = z.object({
  id: z.union([z.string(), z.number()]),
  email: z.string().optional().nullable(),
  contact_email: z.string().optional().nullable(),
  customer: z
    .object({
      id: z.union([z.string(), z.number()]).optional().nullable(),
      email: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  line_items: z
    .array(
      z.object({
        product_id: z.union([z.string(), z.number()]).optional().nullable(),
      }),
    )
    .optional(),
});

export type OrderPaid = z.infer<typeof orderPaidSchema>;

export function orderEmail(order: OrderPaid) {
  return (order.customer?.email || order.email || order.contact_email || "")
    .trim()
    .toLowerCase();
}

export function orderProductIds(order: OrderPaid) {
  const ids = new Set<string>();
  for (const item of order.line_items ?? []) {
    if (item.product_id === null || item.product_id === undefined) continue;
    const id = String(item.product_id).trim();
    if (id) ids.add(id);
  }
  return [...ids];
}
