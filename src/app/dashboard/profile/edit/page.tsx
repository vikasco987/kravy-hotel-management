// import BusinessProfileForm from "../_components/BusinessProfileForm";

// async function getProfile() {
//   const res = await fetch("http://localhost:3000/api/profile", {
//     cache: "no-store",
//   });
//   return res.json();
// }

// export default async function Page() {
//   const data = await getProfile();

//   return (
//     <BusinessProfileForm
//       mode="edit"
//       redirectOnSuccess="/profile"
//       defaultValues={{
//         businessType: data.businessType,
//         businessName: data.businessName,
//         businessTagline: data.businessTagLine,

//         contactName: data.contactPersonName,
//         contactPhone: data.contactPersonPhone,
//         contactEmail: data.contactPersonEmail,

//         upi: data.upi,
//         gstNumber: data.gstNumber,

//         businessAddress: data.businessAddress,
//         state: data.state,
//         district: data.district,
//         pinCode: data.pinCode,

//         profileImageUrl: data.profileImageUrl,
//         logoUrl: data.logoUrl,
//         signatureUrl: data.signatureUrl,
//       }}
//     />
//   );
// }


import BusinessProfileFormClient from "./BusinessProfileFormClient";

async function getProfile() {
  const res = await fetch("http://localhost:3000/api/profile", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch profile");
  }

  return res.json();
}

export default async function Page() {
  const data = await getProfile();

  return (
    <BusinessProfileFormClient
      defaultValues={{
        businessType: data.businessType,
        businessName: data.businessName,
        businessTagLine: data.businessTagLine,

        contactName: data.contactPersonName,
        contactPhone: data.contactPersonPhone,
        contactEmail: data.contactPersonEmail,

        upi: data.upi,
        gstNumber: data.gstNumber,

        businessAddress: data.businessAddress,
        state: data.state,
        district: data.district,
        pinCode: data.pinCode,

        profileImageUrl: data.profileImageUrl,
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
      }}
    />
  );
}
