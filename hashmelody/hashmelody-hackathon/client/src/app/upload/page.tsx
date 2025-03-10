"use client";

// import { usePrivy } from "@privy-io/react-auth";
import Sidebar from "@/app/components/sidebar";
import { GenerateForm } from "@/app/components/upload/GenerateForm";

export default function CreatePage() {
  // const { user } = usePrivy();

  return (
    <div className="flex min-h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 pl-64">
        <GenerateForm />
      </div>
    </div>
  );
}
