"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createCampaignAction } from "@/server/actions/marketing/content";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CampaignOption = { id: string; name: string };

type Props = {
  campaigns: CampaignOption[];
  value: string | null;
  onChange: (campaignId: string | null) => void;
  onCampaignsChange?: (campaigns: CampaignOption[]) => void;
  disabled?: boolean;
};

export function CampaignPickerDialog({
  campaigns: initialCampaigns,
  value,
  onChange,
  onCampaignsChange,
  disabled,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"select" | "create">("select");
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");

  const selectedName =
    value === null || value === ""
      ? null
      : (campaigns.find((c) => c.id === value)?.name ?? null);

  function handleSelect(campaignId: string | null) {
    onChange(campaignId);
    setOpen(false);
    setTab("select");
  }

  function handleCreate() {
    if (newName.trim().length < 3) {
      toast.error("Nome da campanha deve ter pelo menos 3 caracteres");
      return;
    }
    startTransition(async () => {
      const res = await createCampaignAction({
        name: newName.trim(),
        description: newDescription.trim() || undefined,
        start_date: newStartDate ? new Date(newStartDate) : undefined,
        end_date: newEndDate ? new Date(newEndDate) : undefined,
        color: newColor,
      });
      if (res.error) {
        toast.error(String(res.error));
        return;
      }
      const created = res.data as { id: string; name: string };
      const next = [...campaigns, { id: created.id, name: created.name }];
      setCampaigns(next);
      onCampaignsChange?.(next);
      onChange(created.id);
      setNewName("");
      setNewDescription("");
      setNewStartDate("");
      setNewEndDate("");
      setOpen(false);
      setTab("select");
      toast.success("Campanha criada");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-start font-normal"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        {selectedName ?? "Campanha (opcional)"}
      </Button>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Campanha</DialogTitle>
          <DialogDescription>
            Associe esta publicação a uma campanha ou crie uma nova.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 border-b pb-2">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === "select"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => setTab("select")}
          >
            Selecionar
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm",
              tab === "create"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => setTab("create")}
          >
            Nova campanha
          </button>
        </div>

        {tab === "select" ? (
          <ul className="max-h-64 space-y-1 overflow-y-auto">
            <li>
              <button
                type="button"
                className={cn(
                  "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                  !value && "bg-muted font-medium",
                )}
                onClick={() => handleSelect(null)}
              >
                Nenhuma
              </button>
            </li>
            {campaigns.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    value === c.id && "bg-muted font-medium",
                  )}
                  onClick={() => handleSelect(c.id)}
                >
                  {c.name}
                </button>
              </li>
            ))}
            {!campaigns.length && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhuma campanha cadastrada. Crie uma na aba &quot;Nova campanha&quot;.
              </li>
            )}
          </ul>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign_name">Nome *</Label>
              <Input
                id="campaign_name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Lançamento Q2"
                minLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign_desc">Descrição</Label>
              <Textarea
                id="campaign_desc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={2}
                placeholder="Opcional"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="campaign_start">Início</Label>
                <Input
                  id="campaign_start"
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="campaign_end">Fim</Label>
                <Input
                  id="campaign_end"
                  type="date"
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign_color">Cor</Label>
              <Input
                id="campaign_color"
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="h-10 w-full cursor-pointer"
              />
            </div>
            <Button type="button" disabled={pending} onClick={handleCreate}>
              Criar e selecionar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
