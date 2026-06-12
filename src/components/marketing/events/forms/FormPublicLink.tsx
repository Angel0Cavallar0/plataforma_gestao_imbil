"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publicFormUrl } from "@/lib/constants/marketing-events";
import { getFormQrDownloadUrlAction } from "@/server/actions/marketing/lead-forms";

interface FormPublicLinkProps {
  formId: string;
  slug: string;
  token: string;
}

export function FormPublicLink({ formId, slug, token }: FormPublicLinkProps) {
  const url = publicFormUrl(slug, token);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getFormQrDownloadUrlAction(formId).then((res) => {
      if (!cancelled && res.data) setQrUrl(res.data.url);
    });
    return () => {
      cancelled = true;
    };
  }, [formId, token]);

  function copy() {
    navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  }

  function download() {
    startTransition(async () => {
      const res = await getFormQrDownloadUrlAction(formId);
      if (res.error || !res.data) {
        toast.error(res.error ?? "Erro ao gerar QR Code");
        return;
      }
      const a = document.createElement("a");
      a.href = res.data.url;
      a.download = `qrcode-${slug}.png`;
      a.click();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div>
        <p className="mb-1 text-sm font-medium">Link público</p>
        <div className="flex gap-2">
          <code className="flex-1 truncate rounded-md border bg-background px-3 py-2 text-xs">
            {url}
          </code>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={copy}
            title="Copiar"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {qrUrl ? (
          // QR vem de signed URL temporária do Storage — next/image não otimiza domínios dinâmicos
          <Image
            src={qrUrl}
            alt={`QR Code do formulário ${slug}`}
            width={144}
            height={144}
            unoptimized
            className="h-36 w-36 rounded-md border bg-white p-2"
          />
        ) : (
          <div className="flex h-36 w-36 items-center justify-center rounded-md border bg-muted text-xs text-muted-foreground">
            QR Code...
          </div>
        )}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            QR Code gerado automaticamente — pronto para impressão (PNG 1024×1024).
          </p>
          <Button type="button" variant="outline" onClick={download} disabled={pending}>
            <Download className="mr-2 h-4 w-4" />
            Baixar QR Code
          </Button>
        </div>
      </div>
    </div>
  );
}
