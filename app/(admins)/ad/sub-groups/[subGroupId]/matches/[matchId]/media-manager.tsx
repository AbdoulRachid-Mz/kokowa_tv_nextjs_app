// app/ad/sub-groups/[subGroupId]/matches/[matchId]/media-manager.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, Globe, Link, Eye, Save, X } from "lucide-react";
import { toast } from "sonner";

interface MediaManagerProps {
  videoUrl?: string;
  liveStreamUrl?: string;
  onUpdate: (updates: { video_url?: string; live_stream_url?: string }) => void;
  isSaving: boolean;
}

export function MediaManager({ 
  videoUrl, 
  liveStreamUrl, 
  onUpdate, 
  isSaving 
}: MediaManagerProps) {
  const [localVideoUrl, setLocalVideoUrl] = useState(videoUrl || "");
  const [localLiveStreamUrl, setLocalLiveStreamUrl] = useState(liveStreamUrl || "");
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  const [showStreamPreview, setShowStreamPreview] = useState(false);
  
  const saveVideoUrl = () => {
    onUpdate({ video_url: localVideoUrl || undefined });
    toast.success("URL vidéo sauvegardée");
  };
  
  const saveLiveStreamUrl = () => {
    onUpdate({ live_stream_url: localLiveStreamUrl || undefined });
    toast.success("URL live sauvegardée");
  };
  
  const clearVideoUrl = () => {
    setLocalVideoUrl("");
    onUpdate({ video_url: undefined });
    toast.info("URL vidéo supprimée");
  };
  
  const clearLiveStreamUrl = () => {
    setLocalLiveStreamUrl("");
    onUpdate({ live_stream_url: undefined });
    toast.info("URL live supprimée");
  };
  
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  const getVideoPlatform = (url: string) => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
    if (url.includes('vimeo.com')) return 'Vimeo';
    if (url.includes('facebook.com')) return 'Facebook';
    if (url.includes('twitch.tv')) return 'Twitch';
    return 'Autre';
  };

  return (
    <Card className="p-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Médias & Streaming
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL de la vidéo */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              URL de la vidéo
            </Label>
            {localVideoUrl && (
              <Badge variant="outline">
                {getVideoPlatform(localVideoUrl)}
              </Badge>
            )}
          </div>
          
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
                onClick={clearVideoUrl}
                variant="outline"
                size="icon"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {localVideoUrl && isValidUrl(localVideoUrl) && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowVideoPreview(!showVideoPreview)}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                <Eye className="h-3 w-3" />
                {showVideoPreview ? 'Masquer' : 'Afficher'} la prévisualisation
              </Button>
              
              {showVideoPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <Typography variant="body-sm" theme="muted" className="text-white">
                      Prévisualisation vidéo
                    </Typography>
                  </div>
                  <div className="p-2 bg-muted text-center">
                    <a 
                      href={localVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1"
                    >
                      <Link className="h-3 w-3" />
                      Ouvrir dans un nouvel onglet
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* URL du stream en direct */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Stream en direct
            </Label>
            {localLiveStreamUrl && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
          </div>
          
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
                onClick={clearLiveStreamUrl}
                variant="outline"
                size="icon"
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {localLiveStreamUrl && isValidUrl(localLiveStreamUrl) && (
            <div className="space-y-2">
              <Button
                onClick={() => setShowStreamPreview(!showStreamPreview)}
                variant="outline"
                size="sm"
                className="w-full gap-2"
              >
                <Eye className="h-3 w-3" />
                {showStreamPreview ? 'Masquer' : 'Afficher'} le stream
              </Button>
              
              {showStreamPreview && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="aspect-video bg-black flex items-center justify-center">
                    <div className="text-center">
                      <Typography variant="body-lg" className="text-white mb-2">
                        🔴 EN DIRECT
                      </Typography>
                      <Typography variant="body-sm" theme="muted" className="text-white/80">
                        Connexion au stream...
                      </Typography>
                    </div>
                  </div>
                  <div className="p-2 bg-muted text-center">
                    <a 
                      href={localLiveStreamUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-red-600 hover:underline flex items-center justify-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Rejoindre le stream
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Instructions */}
        <div className="border rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
          <Typography variant="body-sm" weight="medium" className="text-blue-700 mb-2">
            Instructions
          </Typography>
          <Typography variant="body-sm" className="text-blue-600 space-y-1">
            <div>• Vidéo : Lien YouTube, Vimeo, Facebook...</div>
            <div>• Live : Lien Twitch, RTMP, Facebook Live...</div>
            <div>• Les liens s'ouvriront dans un nouvel onglet</div>
          </Typography>
        </div>
      </CardContent>
    </Card>
  );
}