"use client";

import { useRouter } from "next/navigation";
import BusinessProfileForm from "../_components/BusinessProfileForm";

export default function BusinessProfileFormClient({
  defaultValues,
}: {
  defaultValues: any;
}) {
  const router = useRouter();

  return (
    <BusinessProfileForm
      mode="edit"
      defaultValues={defaultValues}
      onSuccess={() => router.push("/dashboard/profile")}
    />
  );
}
