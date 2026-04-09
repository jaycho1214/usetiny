"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2Icon, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const SURVEY_ID = "019a95b4-b799-0000-581c-00eb63b58605";

function getPostHog() {
  return import("posthog-js").then((m) => m.default);
}

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const hasContent = email.trim() !== "" || feedback.trim() !== "";

  const handleClose = useCallback(() => {
    if (hasContent) {
      setShowConfirmClose(true);
    } else {
      setOpen(false);
    }
  }, [hasContent]);

  const confirmClose = useCallback(() => {
    setEmail("");
    setFeedback("");
    setShowConfirmClose(false);
    setOpen(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!feedback.trim()) {
        toast.error("Please enter your feedback");
        return;
      }

      setIsSubmitting(true);

      // Simulate API call - replace with actual API endpoint
      try {
        const posthog = await getPostHog();
        posthog.capture(
          "survey sent",
          {
            $survey_id: SURVEY_ID,
            "$survey_response_ea08f708-00f8-4b7b-b608-021464233168": email,
            "$survey_response_b34af35d-3096-4a62-87e0-8dad505210d5": feedback,
          },
          { send_instantly: true },
        );

        toast.success("Thank you for your feedback!");
        setEmail("");
        setFeedback("");
        setOpen(false);
      } catch {
        toast.error("Failed to submit feedback. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, feedback],
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose();
      } else {
        setOpen(true);
      }
    },
    [handleClose],
  );

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      getPostHog().then((ph) =>
        ph.capture("survey shown", { $survey_id: SURVEY_ID }),
      );
    } else if (prevOpenRef.current) {
      getPostHog().then((ph) =>
        ph.capture("survey dismissed", { $survey_id: SURVEY_ID }),
      );
    }
    prevOpenRef.current = open;
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <MessageSquare className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Send feedback</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              We&apos;d love to hear your thoughts. Let us know how we can
              improve!
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Feedback <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="feedback"
                placeholder="Tell us what you think..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={5}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2Icon className="animate-spin" />}
                Send Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard feedback?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to close and
              discard your feedback?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
