"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

export function DeleteAccountButton(): React.ReactElement {
  const [confirming, setConfirming] = React.useState(false);

  const handleDelete = (): void => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    toast("error", "Account deletion is disabled in demo mode");
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      onBlur={() => setConfirming(false)}
      className={`inline-flex h-10 items-center gap-2 rounded-btn2 px-4 text-sm font-semibold transition-all duration-300 ${
        confirming
          ? "bg-error text-white shadow-lg"
          : "border border-error/30 bg-red-50 text-error hover:border-error hover:bg-error hover:text-white"
      }`}
    >
      <Trash2 className="h-4 w-4" />
      {confirming ? "Click again to confirm" : "Delete Account"}
    </button>
  );
}
