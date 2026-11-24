"use client";

// components/editions/live-stream-control.tsx
// Bloc « Direct vidéo » de la page d'une édition : l'admin colle le lien
// YouTube/Facebook Live puis lance ou arrête le direct. L'app mobile l'affiche
// aussitôt (bouton flottant « Regarder en direct »).

import { useEffect, useState, useTransition } from "react";
import { Radio, Square, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getEditionLiveStream,
  startEditionLive,
  stopEditionLive,
  type EditionLiveStream,
} from "@/actions/live-stream";

export function LiveStreamControl({ editionId }: { editionId: number }) {
  const [live, setLive] = useState<EditionLiveStream | null>(null);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [notify, setNotify] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getEditionLiveStream(editionId)
      .then((data) => {
        if (cancelled || !data) return;
        setLive(data);
        if (data.liveUrl) setUrl(data.liveUrl);
        if (data.liveTitle) setTitle(data.liveTitle);
      })
      .catch(() => toast.error("Impossible de lire l'état du direct"));
    return () => {
      cancelled = true;
    };
  }, [editionId]);

  const isLive = Boolean(live?.liveUrl);

  const onStart = () =>
    startTransition(async () => {
      const res = await startEditionLive(editionId, url, title, notify);
      if (res.success) {
        setLive(res.data ?? null);
        toast.success(isLive ? "Lien du direct mis à jour" : "Direct lancé : visible dans l'app");
      } else {
        toast.error(res.error);
      }
    });

  const onStop = () =>
    startTransition(async () => {
      const res = await stopEditionLive(editionId);
      if (res.success) {
        setLive((prev) => (prev ? { ...prev, liveUrl: null, liveTitle: null, liveStartedAt: null } : prev));
        toast.success("Direct arrêté");
      } else {
        toast.error(res.error);
      }
    });

  return (
    <Card className={isLive ? "border-red-500/60" : undefined}>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Radio className={isLive ? "h-5 w-5 text-red-600 animate-pulse" : "h-5 w-5"} />
          Direct vidéo
        </CardTitle>
        {isLive ? (
          <Badge variant="destructive">EN DIRECT</Badge>
        ) : (
          <Badge variant="secondary">Hors ligne</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Diffusez sur YouTube Live (ou Facebook Live), collez le lien ici puis lancez le direct :
          l&apos;application mobile affiche aussitôt le bouton « Regarder en direct ».
        </p>
        <div className="space-y-2">
          <label htmlFor={`live-url-${editionId}`} className="text-sm font-medium">
            Lien du direct
          </label>
          <Input
            id={`live-url-${editionId}`}
            placeholder="https://www.youtube.com/live/XXXXXXXXXXX"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor={`live-title-${editionId}`} className="text-sm font-medium">
            Titre affiché dans la notification (facultatif)
          </label>
          <Input
            id={`live-title-${editionId}`}
            placeholder="Ex. Finale du Sabre National en direct de Zinder"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            disabled={pending}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notify}
            onChange={(e) => setNotify(e.target.checked)}
            disabled={pending}
          />
          Envoyer une notification aux utilisateurs
        </label>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onStart} disabled={pending || !url.trim()} className="bg-red-600 hover:bg-red-700">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
            {isLive ? "Mettre à jour le lien" : "Lancer le direct"}
          </Button>
          {isLive && (
            <Button variant="outline" onClick={onStop} disabled={pending}>
              <Square className="h-4 w-4" />
              Arrêter le direct
            </Button>
          )}
          {isLive && live?.liveUrl && (
            <Button variant="ghost" asChild>
              <a href={live.liveUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Ouvrir
              </a>
            </Button>
          )}
        </div>
        {isLive && live?.liveStartedAt && (
          <p className="text-xs text-muted-foreground">
            En direct depuis {new Date(live.liveStartedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
