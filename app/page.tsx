import { Suspense } from "react";

import MeetupClientPage from "@/app/MeetupClientPage";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-8 md:px-8">
          <LoadingSkeleton />
        </main>
      }
    >
      <MeetupClientPage />
    </Suspense>
  );
}
