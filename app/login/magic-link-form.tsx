"use client";

import { useActionState } from "react";
import { requestMagicLink, requestShopLogin } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MagicLinkForm({ showShop }: { showShop: boolean }) {
  const [state, action, pending] = useActionState(requestMagicLink, null);
  const [shopState, shopAction, shopPending] = useActionState(requestShopLogin, null);

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
        </div>
        <Button type="submit" disabled={pending} className="w-full" size="lg">
          {pending ? "Sending…" : "Email me a sign-in link"}
        </Button>
        {state && <p className="text-sm font-bold text-[#1e4d3a]">{state.message}</p>}
      </form>
      {showShop && (
        <form action={shopAction}>
          <Button type="submit" variant="outline" className="w-full" disabled={shopPending}>
            Continue with the Curious Thinkers shop
          </Button>
          {shopState && <p className="mt-2 text-sm text-[#5e7266]">{shopState.message}</p>}
        </form>
      )}
    </div>
  );
}

export function DemoLogin() {
  return (
    <div className="mt-6 rounded-2xl bg-[#f6efe2] p-4">
      <p className="text-sm font-extrabold text-[#1e4d3a]">Local demo</p>
      <p className="mt-1 text-xs text-[#5e7266]">
        These buttons sign in the seeded family without a password. Turn DEV_DEMO_LOGIN off before deploying.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <DemoButton persona="guardian" label="Continue as Sam" />
        <DemoButton persona="admin" label="Continue as admin" />
      </div>
      <form action="/api/dev/demo-login" method="post" className="mt-2">
        <input type="hidden" name="persona" value="new" />
        <Button type="submit" variant="outline" className="w-full">
          Create a new account
        </Button>
      </form>
    </div>
  );
}

function DemoButton({ persona, label }: { persona: "guardian" | "admin"; label: string }) {
  return (
    <form action="/api/dev/demo-login" method="post" className="flex-1">
      <input type="hidden" name="persona" value={persona} />
      <Button type="submit" variant={persona === "admin" ? "outline" : "bottle"} className="w-full">
        {label}
      </Button>
    </form>
  );
}
