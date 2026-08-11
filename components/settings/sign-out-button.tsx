"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton(): React.ReactElement {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  return (
    <Button
      variant="danger"
      loading={busy}
      onClick={() => {
        setBusy(true);
        void signOut({ redirect: false }).then(() => {
          router.push("/login");
          router.refresh();
        });
      }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </Button>
  );
}