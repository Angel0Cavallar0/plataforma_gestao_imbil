"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveMetaCredentialsAction } from "@/server/actions/marketing/credentials";
import { toast } from "sonner";

export function MetaCredentialsForm({ platformId }: { platformId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          const res = await saveMetaCredentialsAction({
            platform_id: platformId,
            label: String(fd.get("label")),
            app_id: String(fd.get("app_id")),
            app_secret: String(fd.get("app_secret")),
            facebook_page_id: String(fd.get("facebook_page_id")),
            instagram_user_id: String(fd.get("instagram_user_id")),
            system_user_token: String(fd.get("system_user_token")),
          });
          if (res.error) toast.error(String(res.error));
          else {
            toast.success(
              res.connectionOk
                ? "Credencial salva e conectada"
                : "Salva, mas conexão falhou",
            );
            router.refresh();
            e.currentTarget.reset();
          }
        });
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="label">Rótulo da conta</Label>
        <Input id="label" name="label" required placeholder="Imbil Principal" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="app_id">App ID</Label>
          <Input id="app_id" name="app_id" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="app_secret">App Secret</Label>
          <Input id="app_secret" name="app_secret" type="password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="facebook_page_id">Facebook Page ID</Label>
          <Input id="facebook_page_id" name="facebook_page_id" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram_user_id">Instagram User ID</Label>
          <Input id="instagram_user_id" name="instagram_user_id" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="system_user_token">System User Token</Label>
        <Textarea id="system_user_token" name="system_user_token" required rows={3} />
      </div>
      <Button type="submit" disabled={pending}>
        Salvar integração
      </Button>
    </form>
  );
}
