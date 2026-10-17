// app/(admins)/ad/matches/[matchId]/media-manager.tsx
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Globe, Save, X, FileVideo } from "lucide-react";
import { toast } from "sonner";

interface MediaManagerProps {
  matchId: number;
  subGroupId?: number;
  videoUrl?: string; // URL de la vidéo du sous-groupe
  liveStreamUrl?: string;
  onUpdateMatch: (updates: { video_url?: string }) => void;
  onUpdateSubGroup?: (updates: { video_url?: string }) => void;
  isSaving: boolean;
}

export function MediaManager({
  matchId,
  subGroupId,
  videoUrl,
  liveStreamUrl,
  onUpdateMatch,
  onUpdateSubGroup,
  isSaving,
}: MediaManagerProps) {
  const [localVideoUrl, setLocalVideoUrl] = useState(videoUrl || "");
  const [localLiveStreamUrl, setLocalLiveStreamUrl] = useState(
    liveStreamUrl || "",
  );

  // Synchroniser quand les props changent
  useEffect(() => {
    setLocalVideoUrl(videoUrl || "");
  }, [videoUrl]);

  useEffect(() => {
    setLocalLiveStreamUrl(liveStreamUrl || "");
  }, [liveStreamUrl]);

  const saveVideoUrl = () => {
    if (onUpdateSubGroup) {
      onUpdateSubGroup({ video_url: localVideoUrl || undefined });
      toast.success("URL live de la vidéo de la rencontre sauvegardée");
    }
  };

  const saveLiveStreamUrl = () => {
    onUpdateMatch({ video_url: localLiveStreamUrl || undefined });
    toast.success("URL de la vidéo du match sauvegardée");
  };

  const clearVideoUrl = () => {
    setLocalVideoUrl("");
    if (onUpdateSubGroup) {
      onUpdateSubGroup({ video_url: undefined });
      toast.success("URL de la vidéo supprimée");
    }
  };

  const clearLiveStreamUrl = () => {
    setLocalLiveStreamUrl("");
    onUpdateMatch({ video_url: undefined });
    toast.success("URL de la vidéo du match supprimée");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Video className="h-5 w-5" />
          Diffusion et Médias
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vidéo du match */}
        <div className="space-y-2">
          <Label htmlFor="livestream-url" className="text-xs">
            Lien vidéo / Replay du match
          </Label>
          <div className="flex gap-2">
            <Input
              id="livestream-url"
              placeholder="https://youtube.com/live/..."
              value={localLiveStreamUrl}
              onChange={(e) => setLocalLiveStreamUrl(e.target.value)}
              className="text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={saveLiveStreamUrl}
              disabled={isSaving || localLiveStreamUrl === (liveStreamUrl || "")}
            >
              <Save className="h-4 w-4" />
            </Button>
            {localLiveStreamUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLiveStreamUrl}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Vidéo du sous-groupe (si présent) */}
        {subGroupId && onUpdateSubGroup && (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="subgroup-video-url" className="text-xs">
              Lien direct de la rencontre (Sous-groupe)
            </Label>
            <div className="flex gap-2">
              <Input
                id="subgroup-video-url"
                placeholder="https://youtube.com/live/..."
                value={localVideoUrl}
                onChange={(e) => setLocalVideoUrl(e.target.value)}
                className="text-xs"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={saveVideoUrl}
                disabled={isSaving || localVideoUrl === (videoUrl || "")}
              >
                <Save className="h-4 w-4" />
              </Button>
              {localVideoUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearVideoUrl}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
