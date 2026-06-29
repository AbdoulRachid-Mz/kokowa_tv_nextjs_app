// components/articles/content-upload.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, File, Loader2, FileCode, FileJson } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

interface ContentUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  rows?: number;
}

const SUPPORTED_FORMATS = [
  { ext: ".md", label: "Markdown", icon: FileCode },
  { ext: ".txt", label: "Texte", icon: FileText },
  { ext: ".pdf", label: "PDF", icon: File },
  { ext: ".doc", label: "Word", icon: FileText },
  { ext: ".docx", label: "Word", icon: FileText },
  { ext: ".html", label: "HTML", icon: FileCode },
  { ext: ".json", label: "JSON", icon: FileJson },
];

export function ContentUpload({
  value,
  onChange,
  disabled = false,
  className,
  placeholder = "Contenu de l'article...",
  rows = 12,
}: ContentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    const fileExt = "." + file.name.split(".").pop()?.toLowerCase();
    const isSupported = SUPPORTED_FORMATS.some(f => f.ext === fileExt);

    if (!isSupported) {
      toast.error(`Format non supporté. Formats acceptés: ${SUPPORTED_FORMATS.map(f => f.ext).join(", ")}`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 5 Mo");
      return;
    }

    setIsUploading(true);
    setFileName(file.name);
    setFileSize(file.size);

    try {
      const text = await file.text();
      onChange(text);
      toast.success(`Contenu importé depuis ${file.name}`);
    } catch (error) {
      console.error("Erreur lors de la lecture du fichier:", error);
      toast.error("Erreur lors de la lecture du fichier");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearContent = () => {
    onChange("");
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    const format = SUPPORTED_FORMATS.find(f => f.ext === ext);
    return format ? format.icon : FileText;
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-4 transition-colors",
          "hover:border-primary/50 focus-within:border-primary",
          disabled && "opacity-50 cursor-not-allowed",
          value ? "border-green-500 bg-green-50/30" : "border-gray-300"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={SUPPORTED_FORMATS.map(f => f.ext).join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleFileUpload(file);
            }
          }}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 rounded-lg bg-primary/10">
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : value ? (
                (() => {
                  const Icon = fileName ? getFileIcon(fileName) : FileText;
                  return <Icon className="h-5 w-5 text-green-600" />;
                })()
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {fileName ? (
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{fileName}</span>
                  {fileSize && (
                    <Badge variant="outline" className="text-xs">
                      {formatBytes(fileSize)}
                    </Badge>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">
                    Glissez-déposez ou cliquez pour importer
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Formats supportés: {SUPPORTED_FORMATS.map(f => f.ext).join(" ")}
                    <span className="block mt-0.5">Taille max: 5 Mo</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!value && !isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                <Upload className="h-4 w-4 mr-2" />
                Importer
              </Button>
            )}
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearContent}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Éditeur de texte */}
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled || isUploading}
          className="font-mono text-sm resize-y min-h-[200px]"
        />
        {value && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs">
              {value.split("\n").length} lignes • {value.length} caractères
            </Badge>
          </div>
        )}
      </div>

      {/* Aperçu des formats supportés */}
      {value && !fileName && (
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_FORMATS.map((format) => (
            <Badge key={format.ext} variant="outline" className="text-xs gap-1">
              <format.icon className="h-3 w-3" />
              {format.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}