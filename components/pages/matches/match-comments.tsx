// components/pages/matches/match-comments.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Send, Heart, LogIn, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface MatchCommentsProps {
  matchId: number;
}

export function MatchComments({ matchId }: MatchCommentsProps) {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [commentContent, setCommentContent] = useState("");

  // Récupérer les commentaires du match
  const {
    data: commentsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["match-comments", matchId],
    queryFn: async () => {
      const res = await fetch(
        `/api/messages?entity_type=match&entity_id=${matchId}&limit=50&with_author=true`
      );
      if (!res.ok) throw new Error("Impossible de charger les commentaires");
      return res.json();
    },
    staleTime: 10000,
  });

  const comments = commentsData?.data || [];

  // Mutation pour publier un commentaire
  const postMutation = useMutation({
    mutationFn: async (content: string) => {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("message_type", "comment");
      formData.append("entity_type", "match");
      formData.append("entity_id", String(matchId));
      if (user?.userDocument?.id) {
        formData.append("author_id", String(user.userDocument.id));
      }

      const res = await fetch("/api/messages", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la publication");
      }

      return res.json();
    },
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["match-comments", matchId] });
      toast.success("Votre commentaire a été publié !");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Mutation pour liker un commentaire
  const likeMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await fetch(`/api/messages/${messageId}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur lors du like");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["match-comments", matchId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      toast.error("Veuillez saisir un message.");
      return;
    }
    if (!user) {
      toast.error("Veuillez vous connecter pour commenter.");
      return;
    }
    postMutation.mutate(commentContent.trim());
  };

  return (
    <Card className="border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <CardTitle>Commentaires ({comments.length})</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Formulaire de publication */}
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback>
                  {user.displayName?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  placeholder="Partagez vos impressions sur cette rencontre..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  className="min-h-[80px] resize-none"
                  disabled={postMutation.isPending}
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={postMutation.isPending || !commentContent.trim()}
                    className="gap-2"
                  >
                    {postMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Publier
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-4 bg-muted/40 rounded-xl text-center space-y-2">
            <Typography variant="body-sm" theme="muted">
              Connectez-vous pour participer à la discussion et commenter ce match.
            </Typography>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link href={`/auth/login?redirect=/matches/${matchId}`}>
                <LogIn className="h-4 w-4" />
                Se connecter
              </Link>
            </Button>
          </div>
        )}

        {/* Liste des commentaires */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground space-y-1">
            <MessageSquare className="h-8 w-8 mx-auto opacity-40 mb-2" />
            <Typography variant="body-sm">
              Aucun commentaire pour le moment.
            </Typography>
            <Typography variant="caption1" theme="muted">
              Soyez le premier à commenter ce combat !
            </Typography>
          </div>
        ) : (
          <div className="space-y-4 divide-y">
            {comments.map((comment: any) => {
              const authorName =
                comment.author?.username ||
                [comment.author?.first_name, comment.author?.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                "Utilisateur";

              const timeAgo = comment.created_at
                ? formatDistanceToNow(new Date(comment.created_at), {
                    addSuffix: true,
                    locale: fr,
                  })
                : "";

              return (
                <div key={comment.id} className="pt-4 first:pt-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={comment.author?.profile_picture} />
                        <AvatarFallback className="text-xs">
                          {authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Typography variant="body-sm" weight="semibold">
                          {authorName}
                        </Typography>
                        <Typography variant="caption1" theme="muted">
                          {timeAgo}
                        </Typography>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => likeMutation.mutate(comment.id)}
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-red-600"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {comment.like_count || 0}
                    </Button>
                  </div>

                  <Typography variant="body-base" className="pl-9 text-foreground/90">
                    {comment.content}
                  </Typography>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
