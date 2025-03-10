import { LoadingSpinner } from "@/app/components/shared/LoadingSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <LoadingSpinner />
    </div>
  );
}
