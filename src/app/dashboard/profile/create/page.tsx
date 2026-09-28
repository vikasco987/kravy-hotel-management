"use client";
// import BusinessProfileForm from "../_components/BusinessProfileForm";

// export default function Page() {
//   return (
//     <BusinessProfileForm
//       mode="create"
//       redirectOnSuccess="/profile"
//     />
//   );
// }


import { useRouter } from "next/navigation";
import BusinessProfileForm from "../_components/BusinessProfileForm";

export default function Page() {
  const router = useRouter();

  return (
    <BusinessProfileForm
      mode="create"
      onSuccess={() => router.push("/dashboard/profile")}
    />
  );
}
