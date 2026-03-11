// app/ad/sub-groups/[subGroupId]/matches/[matchId]/media-manager.tsx
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
  subGroupId: number;
  videoUrl?: string; // URL de la vidéo du sous-groupe
  liveStreamUrl?: string;
  onUpdateMatch: (updates: { video_url?: string }) => void;
  onUpdateSubGroup: (updates: { video_url?: string }) => void;
  isSaving: boolean;
}

export function MediaManager({ 
  matchId,
  subGroupId,
  videoUrl, 
  liveStreamUrl, 
  onUpdateMatch,
  onUpdateSubGroup,
  isSaving 
}: MediaManagerProps) {
  const [localVideoUrl, setLocalVideoUrl] = useState(videoUrl || "");
  const [localLiveStreamUrl, setLocalLiveStreamUrl] = useState(liveStreamUrl || "");
  
  // Synchroniser quand les props changent
  useEffect(() => {
    setLocalVideoUrl(videoUrl || "");
  }, [videoUrl]);

  useEffect(() => {
    setLocalLiveStreamUrl(liveStreamUrl || "");
  }, [liveStreamUrl]);
  
  const saveVideoUrl = () => {
    onUpdateSubGroup({ video_url: localVideoUrl || undefined });
    toast.success("URL vidéo du sous-groupe sauvegardée");
  };
  
  const saveLiveStreamUrl = () => {
    onUpdateMatch({ video_url: localLiveStreamUrl || undefined });
    toast.success("URL live du match sauvegardée");
  };
  
  const clearVideoUrl = () => {
    setLocalVideoUrl("");
    onUpdateSubGroup({ video_url: undefined });
    toast.success("URL vidéo supprimée");
  };
  
  const clearLiveStreamUrl = () => {
    setLocalLiveStreamUrl("");
    onUpdateMatch({ video_url: undefined });
    toast.success("URL live supprimée");
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Médias & Streaming
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <FileVideo className="h-4 w-4" />
            URL de la vidéo (Sous-groupe)
          </Label>
          
          <div className="flex gap-2">
            <Input
              value={localVideoUrl}
              onChange={(e) => setLocalVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              disabled={isSaving}
              className="flex-1"
            />
            <Button
              onClick={saveVideoUrl}
              size="icon"
              disabled={isSaving || !localVideoUrl || localVideoUrl === videoUrl}
              title="Sauvegarder"
            >
              <Save className="h-4 w-4" />
            </Button>
            {localVideoUrl && (
              <Button
                onClick={clearVideoUrl}
                variant="outline"
                size="icon"
                disabled={isSaving}
                title="Supprimer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Typography variant="body-sm" theme="muted">
            Cette vidéo sera disponible pour tout le sous-groupe
          </Typography>
        </div>
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Stream en direct (Match)
          </Label>
          
          <div className="flex gap-2">
            <Input
              value={localLiveStreamUrl}
              onChange={(e) => setLocalLiveStreamUrl(e.target.value)}
              placeholder="https://streaming.com/live/..."
              disabled={isSaving}
              className="flex-1"
            />
            <Button
              onClick={saveLiveStreamUrl}
              size="icon"
              disabled={isSaving || !localLiveStreamUrl || localLiveStreamUrl === liveStreamUrl}
              title="Sauvegarder"
            >
              <Save className="h-4 w-4" />
            </Button>
            {localLiveStreamUrl && (
              <Button
                onClick={clearLiveStreamUrl}
                variant="outline"
                size="icon"
                disabled={isSaving}
                title="Supprimer"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Typography variant="body-sm" theme="muted">
            Lien de streaming en direct pour ce match uniquement
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}