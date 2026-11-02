"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Layers } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: NewCategoryModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#4f46e5");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast("Please provide both a category name and code", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/categories", {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || undefined,
        color: color || undefined,
      });

      toast("Training category created successfully", "success");
      onSuccess();
      onClose();

      setName("");
      setCode("");
      setDescription("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create category", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <Layers className="w-5 h-5 mr-2 text-primary" />
            Add Training Category
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Define classification tags to categorize training curricula, competencies, and budget reports.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Category Name *</Label>
            <Input
              placeholder="e.g. Cybersecurity, Leadership, Clinical Safety"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) {
                  setCode(e.target.value.slice(0, 5).toUpperCase().replace(/\s+/g, ""));
                }
              }}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category Code *</Label>
              <Input
                placeholder="e.g. CYBER"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Color Tag</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 p-0.5 rounded-lg border border-border cursor-pointer bg-transparent"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Scope, requirements, or guidelines covered under this category..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Category
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
