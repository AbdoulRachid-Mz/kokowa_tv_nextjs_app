"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Activity {
  id: number;
  type: string;
  description: string;
  user_name?: string;
  timestamp: string;
  icon: string;
  color: string;
}

export function RecentActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats?entity=recent&limit=5');
      const result = await response.json();
      
      if (result.success) {
        setActivities(result.data);
      }
    } catch (error) {
      console.error("Erreur chargement activités:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diff = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return `Il y a ${Math.floor(diff / 86400)} j`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activités Récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 py-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activités Récentes
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={loadActivities}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full ${activity.color.replace('text-', 'bg-')} bg-opacity-10 flex-shrink-0`}>
                <span className={activity.color}>{activity.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <Typography variant="body-sm" className="mb-1">
                  {activity.description}
                </Typography>
                <div className="flex items-center gap-2">
                  {activity.user_name && (
                    <Typography variant="caption2" theme="muted">
                      Par {activity.user_name}
                    </Typography>
                  )}
                  <Typography variant="caption2" theme="muted">
                    {getTimeAgo(activity.timestamp)}
                  </Typography>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.type}
              </Badge>
            </div>
          ))}
          
          {activities.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6">
              <Clock className="h-8 w-8 text-muted-foreground mb-2" />
              <Typography theme="muted">Aucune activité récente</Typography>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}