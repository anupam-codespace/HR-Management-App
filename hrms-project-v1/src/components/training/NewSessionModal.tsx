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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Calendar } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewSessionModalProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plans?: any[];
}

export default function NewSessionModal({
  planId,
  isOpen,
  onClose,
  onSuccess,
  plans = [],
}: NewSessionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId || "");
  const [title, setTitle] = useState("");
  const [sessionNumber, setSessionNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [venueOrLink, setVenueOrLink] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("HYBRID");
  const [capacity, setCapacity] = useState<number>(50);
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (planId) {
      setSelectedPlanId(planId);
    } else if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [planId, plans]);

  // When selected plan changes, auto-populate default trainer & venue if empty
  React.useEffect(() => {
    if (selectedPlanId) {
      const p = plans.find((item) => item.id === selectedPlanId);
      if (p) {
        if (!trainerName && p.trainerName) setTrainerName(p.trainerName);
        if (!venueOrLink && p.venueOrLink) setVenueOrLink(p.venueOrLink);
        if (p.deliveryMethod) setDeliveryMethod(p.deliveryMethod);
      }
    }
  }, [selectedPlanId, plans]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlanId = selectedPlanId || planId;
    if (!targetPlanId || !title.trim() || !startTime || !endTime) {
      toast("Please select a training plan and fill in all required fields (title, start & end time)", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/sessions", {
        planId: targetPlanId,
        title: title.trim(),
        sessionNumber: Number(sessionNumber),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        trainerName: trainerName.trim() || undefined,
        venueOrLink: venueOrLink.trim() || undefined,
        deliveryMethod,
        capacity: Number(capacity) || 50,
        notes: notes.trim() || undefined,
      });

      toast("Training session scheduled successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to schedule session", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <Calendar className="w-5 h-5 mr-2 text-primary" />
            Schedule Training Session
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {plans.length > 0 && (
            <div className="space-y-1.5">
              <Label>Target Training Plan *</Label>
              <Select value={selectedPlanId} onValueChange={(val) => setSelectedPlanId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select training plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.planNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Session Title *</Label>
            <Input
              placeholder="e.g. Module 1: Theoretical Foundations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Session Number</Label>
              <Input
                type="number"
                min="1"
                value={sessionNumber}
                onChange={(e) => setSessionNumber(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val || "HYBRID")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online Virtual</SelectItem>
                  <SelectItem value="CLASSROOM">Classroom / In-Person</SelectItem>
                  <SelectItem value="ON_THE_JOB">On-the-Job / Practical</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assigned Trainer</Label>
            <Input
              placeholder="Trainer name or Instructor"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Venue or Online Meeting Link</Label>
            <Input
              placeholder="e.g. Training Lab 4 or https://meet.google.com/..."
              value={venueOrLink}
              onChange={(e) => setVenueOrLink(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes or Prerequisites</Label>
            <Textarea
              placeholder="Any instructions for participants..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
