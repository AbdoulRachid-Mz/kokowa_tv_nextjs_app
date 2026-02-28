// app/ad/sub-groups/[subGroupId]/matches/[matchId]/media-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Globe, Save, X } from "lucide-react";
import { toast } from "sonner";

interface MediaManagerProps {
  matchId: number;
  videoUrl?: string;
  liveStreamUrl?: string;
  onUpdate: (updates: { video_url?: string; live_stream_url?: string }) => void;
  isSaving: boolean;
}

export function MediaManager({ 
  matchId,
  videoUrl, 
  liveStreamUrl, 
  onUpdate, 
  isSaving 
}: MediaManagerProps) {
  const [localVideoUrl, setLocalVideoUrl] = useState(videoUrl || "");
  const [localLiveStreamUrl, setLocalLiveStreamUrl] = useState(liveStreamUrl || "");
  
  const saveVideoUrl = () => {
    onUpdate({ video_url: localVideoUrl || undefined });
    toast.success("URL vidéo sauvegardée");
  };
  
  const saveLiveStreamUrl = () => {
    onUpdate({ live_stream_url: localLiveStreamUrl || undefined });
    toast.success("URL live sauvegardée");
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
            <Video className="h-4 w-4" />
            URL de la vidéo
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
              disabled={isSaving || !localVideoUrl}
            >
              <Save className="h-4 w-4" />
            </Button>
            {localVideoUrl && (
              <Button
                onClick={() => {
                  setLocalVideoUrl("");
                  onUpdate({ video_url: undefined });
                }}
                variant="outline"
                size="icon"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Stream en direct
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
              disabled={isSaving || !localLiveStreamUrl}
            >
              <Save className="h-4 w-4" />
            </Button>
            {localLiveStreamUrl && (
              <Button
                onClick={() => {
                  setLocalLiveStreamUrl("");
                  onUpdate({ live_stream_url: undefined });
                }}
                variant="outline"
                size="icon"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}