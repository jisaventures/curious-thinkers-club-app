import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyShopifyHmac } from "./hmac.ts";

test("accepts a valid Shopify HMAC", () => {
  const secret = "shpss_test_secret";
  const body = JSON.stringify({ id: 1001 });
  const header = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  assert.equal(verifyShopifyHmac(body, header, secret), true);
});

test("rejects a tampered body and a missing secret", () => {
  const secret = "shpss_test_secret";
  const body = JSON.stringify({ id: 1001 });
  const header = createHmac("sha256", secret).update(body, "utf8").digest("base64");
  assert.equal(verifyShopifyHmac(body + " ", header, secret), false);
  assert.equal(verifyShopifyHmac(body, header, ""), false);
  assert.equal(verifyShopifyHmac(body, null, secret), false);
});
