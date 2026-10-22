"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Download, FileJson, ClipboardPaste, Info, AlertCircle, Sparkles, X, Check, ChevronDown, Percent, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { uploadToCloudinary } from "@/lib/cloudinary-client";
import { INDIA_STATE_DISTRICT } from "@/lib/india-state-district";
import { notifyProfileUpdated } from "@/hooks/useProfileCache";


import {
  DEFAULT_PRINT_BRANDING,
  BrandingAlign,
  PrintBrandingSettings,
  LOGO_SIZE_BOUNDS,
  SIGNATURE_SIZE_BOUNDS,
  normalizeLogoSize,
  normalizeSignatureSize,
  normalizeLogoAlign,
  getLogoDimensions,
  getSignatureDimensions,
} from "@/lib/printBranding";

/* ---------------- SCHEMA ---------------- */
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const PHONE_REGEX = /^(?:\+91|91)?[6-9]\d{9}$/;

const schema = z.object({
  id: z.string().optional(),
  businessType: z.string().nullable().optional(),
  businessName: z.string().min(1, "Business name is required"),
  businessTagline: z.string().nullable().optional(),

  contactName: z.string().nullable().optional(),
  contactPhone: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const cleaned = val.replace(/[\s\-()]/g, '');
      return PHONE_REGEX.test(cleaned) || /^\d{10,12}$/.test(cleaned);
    }, { message: "Invalid 10-digit mobile number" }),
  contactEmail: z.string().email("Invalid email format").or(z.literal('')).nullable().optional(),

  upi: z.string().nullable().optional(),
  gstNumber: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return GSTIN_REGEX.test(val.trim().toUpperCase());
    }, { message: "Invalid GSTIN format (e.g. 07AAAAA0000A1Z5)" }),

  businessAddress: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  pinCode: z
    .string()
    .nullable()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return PINCODE_REGEX.test(val.trim());
    }, { message: "PIN code must be exactly 6 digits" }),

  upiQrEnabled: z.boolean().nullable().optional(),
  greetingMessage: z.string().nullable().optional(),

  // Print Branding Controls (Numeric sliders + logo alignment)
  logoSize: z.number().optional(),
  logoAlign: z.enum(["left", "center", "right"]).optional(),
  signatureSize: z.number().optional(),

  // Optional legacy fields preserved for payload compatibility
  menuLinkEnabled: z.boolean().nullable().optional(),
  businessNameSize: z.string().nullable().optional(),
  fssaiNumber: z.string().nullable().optional(),
  fssaiEnabled: z.boolean().nullable().optional(),
  hsnEnabled: z.boolean().nullable().optional(),
  enableMenuQRInBill: z.boolean().nullable().optional(),
  enableClerkAuth: z.boolean().nullable().optional(),
  enableCustomAuth: z.boolean().nullable().optional(),
  tokenNumberSize: z.number().nullable().optional(),
  businessAddressSize: z.number().nullable().optional(),
  phonePrefixType: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function BusinessProfileForm({
  mode,
  defaultValues,
  onCancel,
  onSuccess,
}: {
  mode: "create" | "edit";
  defaultValues?: Partial<FormValues> & {
    profileImageUrl?: string;
    logoUrl?: string;
    signatureUrl?: string;
    upiQrEnabled?: boolean;
    userId?: string;
    id?: string;
    printBranding?: PrintBrandingSettings;
    logoSize?: any;
    logoAlign?: BrandingAlign;
    signatureSize?: any;
    signatureAlign?: BrandingAlign;
  };
  onCancel?: () => void;
  onSuccess?: () => void;
}) {

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(defaultValues?.state || "");

  const [profilePreview, setProfilePreview] = useState<string | null>(
    defaultValues?.profileImageUrl || null
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    defaultValues?.logoUrl || null
  );
  const [signaturePreview, setSignaturePreview] = useState<string | null>(
    defaultValues?.signatureUrl || null
  );

  const initialValues: Partial<FormValues> = {
    ...defaultValues,
    businessType: defaultValues?.businessType || (mode === "create" ? "Hotel" : ""),
    greetingMessage: defaultValues?.greetingMessage ?? "Thank you for staying with us!",
    upiQrEnabled: defaultValues?.upiQrEnabled ?? true,
    logoSize: normalizeLogoSize(defaultValues?.logoSize ?? defaultValues?.printBranding?.logoSize),
    logoAlign: normalizeLogoAlign(defaultValues?.logoAlign ?? defaultValues?.printBranding?.logoAlign),
    signatureSize: normalizeSignatureSize(defaultValues?.signatureSize ?? defaultValues?.printBranding?.signatureSize),
  };

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialValues,
  });

  const [hotelGstEnabled, setHotelGstEnabled] = useState(true);
  const [hotelGstRate, setHotelGstRate] = useState(1200); // 12% in basis points
  const [hotelTaxMode, setHotelTaxMode] = useState<"INCLUSIVE" | "EXCLUSIVE">("INCLUSIVE");
  const [isLoadingHotelSettings, setIsLoadingHotelSettings] = useState(true);
  const [hotelSettingsError, setHotelSettingsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/hotel/settings')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setHotelGstEnabled(res.data.taxEnabled === true);
          setHotelGstRate(typeof res.data.taxRate === 'number' ? res.data.taxRate : 1200);
          setHotelTaxMode(res.data.taxMode === 'EXCLUSIVE' ? 'EXCLUSIVE' : 'INCLUSIVE');
          setHotelSettingsError(null);
        } else {
          setHotelSettingsError(res.error || "Failed to load hotel settings");
        }
      })
      .catch(err => {
        console.error("Error loading hotel settings:", err);
        setHotelSettingsError("Failed to connect to hotel settings service");
      })
      .finally(() => setIsLoadingHotelSettings(false));
  }, []);

  const currentPinCode = watch("pinCode");

  useEffect(() => {
    if (currentPinCode && currentPinCode.length === 6 && /^\d+$/.test(currentPinCode)) {
      fetch(`https://api.postalpincode.in/pincode/${currentPinCode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
            const postOffice = data[0].PostOffice[0];
            const fetchedState = postOffice.State;
            let fetchedDistrict = postOffice.District.replace(/ district$/i, '').trim();

            // Fuzzy match the State
            const stateKeys = Object.keys(INDIA_STATE_DISTRICT);
            const matchedState = stateKeys.find(s => s.toLowerCase() === fetchedState.toLowerCase()) || fetchedState;

            setSelectedState(matchedState);
            setValue("state", matchedState, { shouldValidate: true });

            // Wait for re-render so district options are populated before setting value
            setTimeout(() => {
              const districts = INDIA_STATE_DISTRICT[matchedState] || [];
              const matchedDistrict = districts.find(d => d.toLowerCase() === fetchedDistrict.toLowerCase()) || fetchedDistrict;
              setValue("district", matchedDistrict, { shouldValidate: true });
              toast.success("State & District auto-filled from PIN Code!");
            }, 100);
          }
        })
        .catch((err) => console.error("Failed to fetch pin code details", err));
    }
  }, [currentPinCode, setValue]);

  const watchedValues = watch();

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const getFile = (id: string) =>
        (document.getElementById(id) as HTMLInputElement)?.files?.[0];

      let profileImageUrl = defaultValues?.profileImageUrl || null;
      const profileImageFile = getFile("profileImage");
      if (profileImageFile) {
        try {
          profileImageUrl = await uploadToCloudinary(profileImageFile);
        } catch (uploadErr: any) {
          console.error("Profile image upload failed:", uploadErr);
          toast.error(uploadErr.message || "Profile image upload failed.");
          return;
        }
      }

      let logoUrl = defaultValues?.logoUrl || null;
      const logoFile = getFile("logo");
      if (logoFile) {
        try {
          logoUrl = await uploadToCloudinary(logoFile);
        } catch (uploadErr: any) {
          console.error("Logo upload failed:", uploadErr);
          toast.error(uploadErr.message || "Logo upload failed.");
          return;
        }
      }

      let signatureUrl = defaultValues?.signatureUrl || null;
      const signatureFile = getFile("signature");
      if (signatureFile) {
        try {
          signatureUrl = await uploadToCloudinary(signatureFile);
        } catch (uploadErr: any) {
          console.error("Signature upload failed:", uploadErr);
          toast.error(uploadErr.message || "Signature upload failed.");
          return;
        }
      }

      // ✅ EXPLICIT PAYLOAD (MATCHES API 1:1)
      const payload = {
        id: defaultValues?.id,
        isNewProfile: mode === "create",
        businessType: values.businessType || "Hotel",
        businessName: values.businessName,
        businessTagline: values.businessTagline || null,

        contactName: values.contactName || null,
        contactPhone: values.contactPhone || null,
        contactEmail: values.contactEmail || null,

        upi: values.upi || null,

        profileImage: profileImageUrl,
        logo: logoUrl,
        signature: signatureUrl,

        gstNumber: values.gstNumber ? values.gstNumber.trim().toUpperCase() : null,
        businessAddress: values.businessAddress || null,
        state: values.state || null,
        district: values.district || null,
        pinCode: values.pinCode ? values.pinCode.trim() : null,

        upiQrEnabled: values.upiQrEnabled ?? true,
        greetingMessage: values.greetingMessage || "Thank you for staying with us!",

        // Print Branding Settings (numeric sliders + logo alignment + fixed right signature)
        printBranding: {
          logoSize: normalizeLogoSize(values.logoSize),
          logoAlign: normalizeLogoAlign(values.logoAlign),
          signatureSize: normalizeSignatureSize(values.signatureSize),
          signatureAlign: 'right',
        },
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const status = res.status;
        const text = await res.text().catch(() => "No response text");
        console.error(`Save failed (${status}):`, text);

        let errorMsg = "Unknown Server Error";
        try {
          const errData = JSON.parse(text);
          errorMsg = errData.details || errData.error || errorMsg;
        } catch (e) {}

        toast.error(`Failed to save profile: ${errorMsg}`);
        return;
      }

      const savedData = await res.json();
      console.log("Profile Saved Successfully:", savedData);

      // Persist Hotel GST Settings to HotelSettings model
      try {
        const settingsRes = await fetch("/api/hotel/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taxEnabled: hotelGstEnabled,
            taxRate: hotelGstRate,
            taxMode: hotelTaxMode
          })
        });

        if (!settingsRes.ok) {
          const errData = await settingsRes.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to save hotel GST settings");
        }
      } catch (settingsErr: any) {
        console.error("Failed to save hotel GST settings:", settingsErr);
        toast.error(`Business profile saved, but failed to save GST settings: ${settingsErr.message}`);
        return;
      }

      toast.success("Business profile and GST settings saved successfully!");

      // Dispatch event to refresh GlobalHeader, Sidebar, RoomDashboard etc.
      notifyProfileUpdated(savedData);

      // ✅ SUCCESS
      if (onSuccess) {
        onSuccess();
      }

    } catch (err: any) {
      console.error("Submit error:", err);
      toast.error(err?.message || "Something went wrong while saving your profile. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex flex-col xl:flex-row gap-6 max-w-[1400px] mx-auto p-6 items-start">
      <form
        onSubmit={handleSubmit(onSubmit, (errors) => {
          console.group("🚫 Validation Errors Details");
          console.error("Full Errors Object:", errors);
          Object.keys(errors).forEach(key => {
            console.error(`Field "${key}":`, errors[key as keyof typeof errors]);
          });
          console.groupEnd();
          toast.error("Please fix the validation errors in the form");
        })}
        className="flex-1 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 transition-colors"
      >
      {/* PROPERTY / BUSINESS */}
      <Section title="Property & Business Information">
        <Field label="Property Type" error={errors.businessType?.message}>
          <select
            {...register("businessType")}
            className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 focus:ring-2 focus:ring-[var(--kravy-brand)]/20 transition-all outline-none font-bold"
          >
            <option value="Hotel">Hotel</option>
            <option value="Resort">Resort</option>
            <option value="Guest House">Guest House</option>
            <option value="Boutique Hotel">Boutique Hotel</option>
            <option value="Lodge / Motel">Lodge / Motel</option>
            <option value="Homestay / Bed & Breakfast">Homestay / Bed & Breakfast</option>
            <option value="Hostel">Hostel</option>
          </select>
        </Field>

        <Field label="Property / Business Name *" error={errors.businessName?.message}>
          <Input {...register("businessName")} placeholder="e.g. Kravy Grand Palace" />
        </Field>

        <Field label="Tagline / Subtitle" error={errors.businessTagline?.message}>
          <Input {...register("businessTagline")} placeholder="e.g. Luxury Stays & Suites" />
        </Field>

        <Field label="Invoice Footer Greeting" error={errors.greetingMessage?.message}>
          <Input {...register("greetingMessage")} placeholder="Thank you for staying with us!" />
        </Field>
      </Section>

      {/* CONTACT */}
      <Section title="Contact Information">
        <Field label="Front Desk / Manager Name" error={errors.contactName?.message}>
          <Input {...register("contactName")} placeholder="Full Name" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        </Field>

        <Field label="Front Desk Phone" error={errors.contactPhone?.message}>
          <Input {...register("contactPhone")} placeholder="10-digit mobile number" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        </Field>

        <Field label="Official Hotel Email" error={errors.contactEmail?.message}>
          <Input {...register("contactEmail")} placeholder="reservations@hotel.com" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        </Field>

        <Field label="Front Desk UPI ID (Optional)" error={errors.upi?.message}>
          <Input {...register("upi")} placeholder="e.g. hotel@upi" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        </Field>

        <div className="md:col-span-2">
          <label className="flex items-center gap-3 cursor-pointer bg-[var(--kravy-bg-2)] p-4 rounded-xl border border-[var(--kravy-border)] hover:border-indigo-500/50 transition-colors">
            <input
              type="checkbox"
              {...register("upiQrEnabled")}
              className="w-5 h-5 rounded min-w-[20px] accent-[var(--kravy-brand)]"
            />
            <div>
              <p className="text-sm font-bold text-[var(--kravy-text-primary)]">Enable UPI QR on Guest Invoice</p>
              <p className="text-xs text-[var(--kravy-text-muted)] mt-0.5">Prints a scannable payment QR code on guest folios and thermal receipts</p>
            </div>
          </label>
        </div>
      </Section>

      {/* ADDRESS & TAX */}
      <Section title="Property Address & Tax Registration">
        <div className="md:col-span-2">
          <Field label="Street Address" error={errors.businessAddress?.message}>
            <Input {...register("businessAddress")} placeholder="Plot No, Street, Landmark" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
          </Field>
        </div>

        <Field label="State" error={errors.state?.message}>
          <select
            {...register("state")}
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 outline-none font-bold focus:ring-2 focus:ring-[var(--kravy-brand)]/20"
          >
            <option value="">Select State</option>
            {Object.keys(INDIA_STATE_DISTRICT).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="District" error={errors.district?.message}>
          <select {...register("district")} className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 outline-none font-bold focus:ring-2 focus:ring-[var(--kravy-brand)]/20">
            <option value="">Select District</option>
            {selectedState &&
              INDIA_STATE_DISTRICT[selectedState]?.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
          </select>
        </Field>

        <Field label="PIN Code" error={errors.pinCode?.message}>
          <Input {...register("pinCode")} placeholder="6-digit postal code" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)]" />
        </Field>

        <Field label="GSTIN (Optional)" error={errors.gstNumber?.message}>
          <Input {...register("gstNumber")} placeholder="e.g. 07AAAAA0000A1Z5" className="h-11 rounded-xl bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] uppercase" />
        </Field>
      </Section>

      {/* HOTEL ACCOMMODATION GST SETTINGS */}
      <Card className="rounded-[32px] border-[var(--kravy-border)] bg-[var(--kravy-surface)] shadow-2xl overflow-hidden">
        <CardHeader className="border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/50 py-4 px-6 sm:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--kravy-brand)]/10 text-[var(--kravy-brand)] flex items-center justify-center font-bold">
                <Percent size={16} />
              </div>
              <div>
                <CardTitle className="text-sm font-black text-[var(--kravy-text-primary)] tracking-tight uppercase tracking-wider">
                  Hotel Accommodation GST Settings
                </CardTitle>
                <p className="text-[11px] text-[var(--kravy-text-muted)] font-medium">
                  Room tariffs, extra charges & check-in billing tax rules
                </p>
              </div>
            </div>
            {isLoadingHotelSettings && (
              <span className="text-[11px] font-medium text-[var(--kravy-text-muted)] animate-pulse">Loading settings...</span>
            )}
            {hotelSettingsError && (
              <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
                <AlertCircle size={13} /> {hotelSettingsError}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Toggle Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/40 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[var(--kravy-text-primary)]">Enable Hotel GST</span>
                {hotelGstEnabled ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 border border-gray-500/20">
                    Disabled (0% Tax)
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--kravy-text-muted)] max-w-xl leading-relaxed">
                Automatically calculate and split CGST & SGST on hotel room tariffs and guest folios. When disabled, 0% tax is applied to newly generated room tariffs.
              </p>
            </div>
            <label className={`relative inline-flex items-center shrink-0 self-start sm:self-center ${isLoadingHotelSettings ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={hotelGstEnabled}
                disabled={isLoadingHotelSettings}
                onChange={(e) => setHotelGstEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[var(--kravy-brand)]"></div>
            </label>
          </div>

          {/* Controls Grid */}
          {hotelGstEnabled ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default GST Rate */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-[11px] font-black text-[var(--kravy-text-primary)] uppercase tracking-wider">
                      Default Hotel GST Rate
                    </Label>
                    <span className="text-[10px] font-mono font-bold text-[var(--kravy-brand)] bg-[var(--kravy-brand)]/10 px-2 py-0.5 rounded border border-[var(--kravy-brand)]/20">
                      {(hotelGstRate / 100).toFixed(0)}% GST
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={hotelGstRate}
                      onChange={(e) => setHotelGstRate(Number(e.target.value))}
                      className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-12 pl-4 pr-10 outline-none font-bold text-sm focus:ring-2 focus:ring-[var(--kravy-brand)]/20 appearance-none transition-all cursor-pointer"
                    >
                      <option value={0}>0% GST — Tax Exempt / Unregistered</option>
                      <option value={500}>5% GST — (2.5% CGST + 2.5% SGST)</option>
                      <option value={1200}>12% GST — Standard Accommodation Slab (6% + 6%)</option>
                      <option value={1800}>18% GST — Luxury / Premium Tariff Slab (9% + 9%)</option>
                      <option value={2800}>28% GST — Special / Star Classification Slab (14% + 14%)</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" />
                  </div>
                  <p className="text-[11px] text-[var(--kravy-text-muted)] leading-normal ml-1">
                    Hotel-wide fallback rate. Active room-specific Tax Profiles take precedence. Please confirm the legally applicable slab with your accountant.
                  </p>
                </div>

                {/* Default Pricing Mode */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <Label className="text-[11px] font-black text-[var(--kravy-text-primary)] uppercase tracking-wider">
                      Default Pricing Mode
                    </Label>
                    <span className="text-[10px] font-mono font-bold text-[var(--kravy-text-primary)] bg-[var(--kravy-bg-2)] px-2 py-0.5 rounded border border-[var(--kravy-border)]">
                      {hotelTaxMode}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      value={hotelTaxMode}
                      onChange={(e) => setHotelTaxMode(e.target.value as 'INCLUSIVE' | 'EXCLUSIVE')}
                      className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-12 pl-4 pr-10 outline-none font-bold text-sm focus:ring-2 focus:ring-[var(--kravy-brand)]/20 appearance-none transition-all cursor-pointer"
                    >
                      <option value="INCLUSIVE">INCLUSIVE — Displayed rent already includes GST</option>
                      <option value="EXCLUSIVE">EXCLUSIVE — GST is added on top of base rent</option>
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--kravy-text-muted)]" />
                  </div>
                  <p className="text-[11px] text-[var(--kravy-text-muted)] leading-normal ml-1">
                    {hotelTaxMode === 'INCLUSIVE'
                      ? 'Inclusive: e.g. ₹2,500 displayed rent already contains GST (guest pays ₹2,500 total).'
                      : 'Exclusive: e.g. ₹2,500 base rent + 12% GST (₹300) = guest pays ₹2,800 total.'}
                  </p>
                </div>
              </div>

              {/* Precedence and Compliance Notice */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-900 dark:text-blue-300">
                <ShieldCheck size={18} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Configuration Precedence:</span> Any room assigned an active <span className="font-semibold underline">TaxProfile</span> overrides this hotel default. If hotel GST is toggled off, new bookings calculate with 0% GST. Existing checked-in stays and settled historical invoices remain strictly protected.
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-900 dark:text-amber-300 flex items-center gap-3">
              <Info size={18} className="shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs font-medium">
                Hotel GST is currently <span className="font-bold">Disabled</span>. All newly created room tariffs and booking check-ins will calculate with <span className="font-bold">0% tax (Tax Exempt)</span>. Enable the switch above to configure your default rate and pricing mode.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BRANDING */}
      <Section title="Hotel Branding & Signatures">
        <DragDrop id="logo" label="Hotel Logo" preview={logoPreview} setPreview={setLogoPreview} />
        <DragDrop id="signature" label="Manager Signature" preview={signaturePreview} setPreview={setSignaturePreview} />
      </Section>

      {/* PRINT BRANDING SETTINGS */}
      <Section title="Print Branding Settings (Invoices & GRC)">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--kravy-text-primary)]">Hotel Logo Display</span>
              <p className="text-[10px] text-[var(--kravy-text-muted)] font-medium">Applied to A4 & Thermal prints</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--kravy-surface-sunken)] text-[var(--kravy-brand)] border border-[var(--kravy-border-default)]">
              {normalizeLogoSize(watchedValues.logoSize)}px
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-medium text-[var(--kravy-text-secondary)]">
              <span>Logo Size</span>
              <span>{LOGO_SIZE_BOUNDS.min}px – {LOGO_SIZE_BOUNDS.max}px</span>
            </div>
            <input
              type="range"
              min={LOGO_SIZE_BOUNDS.min}
              max={LOGO_SIZE_BOUNDS.max}
              step={LOGO_SIZE_BOUNDS.step}
              {...register("logoSize", { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--kravy-brand)]"
            />
          </div>

          <div className="pt-1">
            <Field label="Logo Alignment">
              <select
                {...register("logoAlign")}
                className="w-full bg-[var(--kravy-input-bg)] border-[var(--kravy-input-border)] text-[var(--kravy-text-primary)] rounded-xl h-11 px-4 outline-none font-bold focus:ring-2 focus:ring-[var(--kravy-brand)]/20 text-xs"
              >
                <option value="left">Left Aligned</option>
                <option value="center">Center Aligned</option>
                <option value="right">Right Aligned</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-[var(--kravy-border-default)]">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--kravy-text-primary)]">Manager Signature Display</span>
              <p className="text-[10px] text-[var(--kravy-text-muted)] font-medium">Permanently right-aligned above Authorized Signatory</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[var(--kravy-surface-sunken)] text-[var(--kravy-brand)] border border-[var(--kravy-border-default)]">
              {normalizeSignatureSize(watchedValues.signatureSize)}px
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-medium text-[var(--kravy-text-secondary)]">
              <span>Signature Size (Width)</span>
              <span>{SIGNATURE_SIZE_BOUNDS.min}px – {SIGNATURE_SIZE_BOUNDS.max}px</span>
            </div>
            <input
              type="range"
              min={SIGNATURE_SIZE_BOUNDS.min}
              max={SIGNATURE_SIZE_BOUNDS.max}
              step={SIGNATURE_SIZE_BOUNDS.step}
              {...register("signatureSize", { valueAsNumber: true })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[var(--kravy-brand)]"
            />
          </div>
        </div>
      </Section>

      {/* ACTION */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 px-6 rounded-xl font-bold text-[var(--kravy-text-primary)] border-[var(--kravy-border)] bg-[var(--kravy-surface)] hover:bg-[var(--kravy-bg-2)] hover:text-[var(--kravy-text-primary)] transition-all"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading} className="bg-[var(--kravy-brand)] text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
          {loading ? "Saving..." : "Save Business Profile"}
        </Button>
      </div>
    </form>

    {/* LIVE HOTEL GUEST FOLIO PREVIEW */}
    <div className="w-full xl:w-[390px] shrink-0 xl:sticky xl:top-24 shadow-2xl rounded-[32px] overflow-hidden border border-[var(--kravy-border)] bg-[var(--kravy-surface)] animate-in fade-in slide-in-from-right-8 transition-all">
      <div className="px-6 py-4 border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/50 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-[var(--kravy-text-primary)] tracking-tight uppercase tracking-wider">Hotel Folio Preview</h3>
            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Live Preview
            </span>
          </div>
          <p className="text-[10px] font-medium text-[var(--kravy-text-muted)] mt-0.5">
            Simulated guest bill based on your selected GST configuration
          </p>
        </div>
      </div>

      {/* Configuration Status Strip */}
      <div className="px-6 py-2.5 bg-gray-50 dark:bg-gray-900 border-b border-[var(--kravy-border)] flex items-center justify-between text-[11px] font-semibold">
        <span className="text-[var(--kravy-text-muted)]">Applied Configuration:</span>
        <span className="font-mono font-bold text-[var(--kravy-text-primary)]">
          {hotelGstEnabled ? `${(hotelGstRate / 100).toFixed(0)}% GST • ${hotelTaxMode}` : '0% GST (Tax Exempt)'}
        </span>
      </div>

      <div className="p-4 sm:p-6 bg-[#E5E5E5] dark:bg-[#151515] flex justify-center overflow-x-auto min-h-[460px]">
        {(() => {
          // Dynamic calculation based on standard ₹2,500 room amount as requested:
          const sampleBaseRent = 2500; // in rupees
          const activeRate = hotelGstEnabled ? hotelGstRate : 0;
          let sampleTaxable = sampleBaseRent;
          let sampleTaxTotal = 0;
          let samplePayable = sampleBaseRent;

          if (hotelGstEnabled && activeRate > 0) {
            if (hotelTaxMode === 'INCLUSIVE') {
              // Taxable = Rent / (1 + Rate)
              sampleTaxable = (sampleBaseRent * 10000) / (10000 + activeRate);
              sampleTaxTotal = sampleBaseRent - sampleTaxable;
              samplePayable = sampleBaseRent;
            } else {
              // EXCLUSIVE: GST added on top
              sampleTaxable = sampleBaseRent;
              sampleTaxTotal = (sampleTaxable * activeRate) / 10000;
              samplePayable = sampleTaxable + sampleTaxTotal;
            }
          }

          const sampleCgst = sampleTaxTotal / 2;
          const sampleSgst = sampleTaxTotal - sampleCgst;
          const halfRate = (activeRate / 200).toFixed(1).replace(/\.0$/, '');

          return (
            <div
              className="bg-white text-black p-4 shadow-xl origin-top mx-auto filter hover:brightness-[0.99] transition-all rounded-sm max-w-full"
              style={{ width: '72mm', minHeight: '130px' }}
            >
              <div className="font-mono text-[10px] leading-tight">
                {/* Logo */}
                {logoPreview && (
                  <div className={`mb-2 ${
                    watchedValues.logoAlign === 'left' ? 'flex justify-start text-left' :
                    watchedValues.logoAlign === 'right' ? 'flex justify-end text-right' :
                    'flex justify-center text-center'
                  }`}>
                    <img
                      src={logoPreview}
                      alt="Hotel Logo"
                      className="object-contain"
                      style={{
                        maxHeight: getLogoDimensions(watchedValues.logoSize || 60).preview.maxHeight,
                        maxWidth: getLogoDimensions(watchedValues.logoSize || 60).preview.maxWidth,
                      }}
                    />
                  </div>
                )}

                {/* Hotel Header */}
                <div className={`font-bold text-[12px] uppercase tracking-wide leading-tight ${
                  watchedValues.logoAlign === 'left' ? 'text-left' :
                  watchedValues.logoAlign === 'right' ? 'text-right' :
                  'text-center'
                }`}>
                  {watchedValues.businessName || "Kravy Grand Hotel"}
                </div>
                {watchedValues.businessTagline && (
                  <div className={`text-[8.5px] italic opacity-80 mt-0.5 ${
                    watchedValues.logoAlign === 'left' ? 'text-left' :
                    watchedValues.logoAlign === 'right' ? 'text-right' :
                    'text-center'
                  }`}>
                    {watchedValues.businessTagline}
                  </div>
                )}

                {(watchedValues.businessAddress || watchedValues.district || selectedState || watchedValues.pinCode || watchedValues.contactPhone) && (
                  <div className="text-center mt-1 opacity-90 text-[8.5px] leading-tight">
                    {watchedValues.businessAddress}
                    {watchedValues.district && `, ${watchedValues.district}`}
                    {selectedState && `, ${selectedState}`}
                    {watchedValues.pinCode && ` - ${watchedValues.pinCode}`}
                    {watchedValues.contactPhone && (
                      <div className="mt-0.5">Ph: {watchedValues.contactPhone}</div>
                    )}
                  </div>
                )}

                <div className="text-center text-[8.5px] font-bold mt-1">
                  GSTIN: {watchedValues.gstNumber ? watchedValues.gstNumber.toUpperCase() : "NOT REGISTERED"}
                </div>

                {/* Folio Info */}
                <div className="mt-2 border-t border-dashed border-gray-400 pt-1.5 px-0.5">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-black uppercase text-[8px] tracking-wider text-black opacity-80">Guest Folio (Sample)</div>
                    <div className="font-bold uppercase text-[7px] bg-black text-white px-1.5 py-0.5 rounded-sm">
                      {watchedValues.businessType || "HOTEL"}
                    </div>
                  </div>
                  <div className="text-[8.5px] space-y-0.5">
                    <div>Guest: <span className="font-bold">Rahul Sharma</span></div>
                    <div>Room: <span className="font-bold">Room 102 (Deluxe)</span></div>
                    <div className="text-[7.5px] text-gray-600">
                      Stay: 1 Night • Pricing: <span className="font-semibold">{hotelGstEnabled ? `GST ${hotelTaxMode}` : 'Exempt'}</span>
                    </div>
                  </div>
                </div>

                {/* Particulars Table */}
                <div className="my-1.5 border-t border-dashed border-gray-400" />

                <div className="flex justify-between font-bold text-[8.5px] opacity-90">
                  <span className="flex-1 pr-1">Particulars</span>
                  <span className="w-[8mm] text-center shrink-0">Qty</span>
                  <span className="w-[14mm] text-right shrink-0">Amount</span>
                </div>

                <div className="border-t border-dashed border-gray-400 my-1" />

                {/* Room Rent */}
                <div className="flex justify-between text-[8.5px] opacity-90 mb-0.5">
                  <span className="flex-1 truncate pr-1">Room Rent</span>
                  <span className="w-[8mm] text-center shrink-0">1</span>
                  <span className="w-[14mm] text-right shrink-0">₹{sampleBaseRent.toFixed(2)}</span>
                </div>

                {/* Tax Breakdown */}
                {hotelGstEnabled && activeRate > 0 ? (
                  <>
                    <div className="border-t border-dotted border-gray-300 my-1 pt-1 text-[8px] text-gray-600">
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span>₹{sampleTaxable.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>CGST ({halfRate}%):</span>
                        <span>₹{sampleCgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({halfRate}%):</span>
                        <span>₹{sampleSgst.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-gray-800">
                        <span>Total GST ({(activeRate / 100).toFixed(0)}%):</span>
                        <span>₹{sampleTaxTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="border-t border-dotted border-gray-300 my-1 pt-1 text-[8px] text-gray-600">
                    <div className="flex justify-between italic">
                      <span>GST (Tax Exempt / 0%):</span>
                      <span>₹0.00</span>
                    </div>
                  </div>
                )}

                <div className="border-t border-dashed border-gray-400 my-1.5" />

                {/* Net Payable */}
                <div className="flex justify-between font-black text-[10.5px]">
                  <span>NET PAYABLE</span>
                  <span>₹{samplePayable.toFixed(2)}</span>
                </div>

                {/* Mode Indicator Note */}
                <div className="text-[7.5px] text-gray-500 italic mt-0.5">
                  * {hotelGstEnabled
                    ? (hotelTaxMode === 'INCLUSIVE'
                      ? 'Inclusive Pricing: GST is included within the ₹2,500 rent.'
                      : 'Exclusive Pricing: GST is added on top of base rent.')
                    : 'GST Disabled: 0% tax applied.'}
                </div>

                <div className="border-t border-dashed border-gray-400 my-1.5" />

                {/* UPI QR Code */}
                {(watchedValues.upi && watchedValues.upiQrEnabled !== false) && (
                  <div className="my-2 text-center">
                    <div className="text-[7.5px] font-bold mb-1">SCAN TO PAY (FRONT DESK)</div>
                    <div className="inline-block border border-gray-300 p-1 rounded-md bg-white">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${watchedValues.upi}&pn=${watchedValues.businessName || "Hotel"}&am=${samplePayable.toFixed(2)}&cu=INR`)}`}
                        alt="UPI QR"
                        className="w-[24mm] h-[24mm] object-contain block mix-blend-multiply"
                      />
                    </div>
                    <div className="text-center text-[7.5px] mt-1 opacity-90">UPI: {watchedValues.upi}</div>
                  </div>
                )}

                {/* Greeting Message */}
                <div className="text-center font-semibold mt-2 opacity-90 text-[8.5px] whitespace-pre-wrap">
                  {watchedValues.greetingMessage || "Thank you for staying with us!"}
                </div>

                {/* Signature */}
                {signaturePreview && (
                  <div className="mt-3 pt-1 border-t border-dotted border-gray-300 text-right">
                    <div className="flex justify-end">
                      <img
                        src={signaturePreview}
                        alt="Signature"
                        className="object-contain"
                        style={{
                          maxHeight: getSignatureDimensions(watchedValues.signatureSize || 120).preview.maxHeight,
                          maxWidth: getSignatureDimensions(watchedValues.signatureSize || 120).preview.maxWidth,
                        }}
                      />
                    </div>
                    <div className="text-[7px] text-gray-500 uppercase mt-0.5">Authorized Signatory</div>
                  </div>
                )}

                <div className="h-[6mm] border-t border-dashed border-gray-200 mt-2" />
              </div>
            </div>
          );
        })()}
      </div>
    </div>

  </div>
  );
}

/* ---------------- SMALL UI HELPERS ---------------- */

function Section({ title, children }: any) {
  return (
    <Card className="rounded-[32px] border-[var(--kravy-border)] bg-[var(--kravy-surface)] shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-[var(--kravy-border)] bg-[var(--kravy-bg-2)]/50">
        <CardTitle className="text-lg font-black text-[var(--kravy-text-primary)] tracking-tight uppercase tracking-widest text-[10px] opacity-70">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6 p-8">
        {children}
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center ml-1">
        <Label className="text-[10px] font-black text-[var(--kravy-text-muted)] uppercase tracking-widest">{label}</Label>
        {error && <span className="text-[10px] font-bold text-rose-500">{error}</span>}
      </div>
      {children}
    </div>
  );
}

function DragDrop({ id, label, preview, setPreview }: any) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      setPreview(URL.createObjectURL(file));
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) {
        input.files = e.dataTransfer.files;
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreview(null);
    const input = document.getElementById(id) as HTMLInputElement;
    if (input) {
      input.value = "";
    }
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative block group border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragging ? 'border-indigo-500 bg-[var(--kravy-surface-hover)]' : 'border-[var(--kravy-border)] hover:bg-[var(--kravy-surface-hover)] hover:border-indigo-500/50'}`}
    >
      <input
        id={id}
        type="file"
        hidden
        onChange={(e) =>
          setPreview(
            e.target.files?.[0]
              ? URL.createObjectURL(e.target.files[0])
              : null
          )
        }
      />
      {preview ? (
        <div className="relative group/image inline-block">
          <img src={preview} className="h-32 mx-auto rounded-xl object-cover shadow-lg border border-[var(--kravy-border)]" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 rounded-xl flex items-center justify-center transition-opacity">
            <p className="text-white text-xs font-bold">Change Image</p>
          </div>
          <button
            onClick={handleRemove}
            type="button"
            className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10 opacity-0 group-hover:opacity-100"
            title="Remove"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <div className="py-4">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[var(--kravy-brand)]/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Plus className="text-[var(--kravy-brand)]" size={24} />
          </div>
          <p className="text-sm font-bold text-[var(--kravy-text-primary)]">Upload {label}</p>
          <p className="text-xs text-[var(--kravy-text-muted)] mt-1">PNG, JPG up to 5MB</p>
        </div>
      )}
    </label>
  );
}
