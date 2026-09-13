"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "ADMIN" | "SELLER" | "STAFF";

export default function CreateUserPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("SELLER");
  const [isDisabled, setIsDisabled] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          isDisabled,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to create user");
      }

      setSuccess("User created successfully");
      setName("");
      setEmail("");
      setPassword("");
      setRole("SELLER");
      setIsDisabled(false);

      // optional: redirect to users list
      setTimeout(() => {
        router.push("/admin/users");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">
        Create New User
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-white p-6 rounded-lg shadow"
      >
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Full Name
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Business Name"          
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temp@123"
          />
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            className="w-full border rounded px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          <input
            id="disabled"
            type="checkbox"
            checked={isDisabled}
            onChange={(e) => setIsDisabled(e.target.checked)}
          />
          <label htmlFor="disabled" className="text-sm">
            Disable user immediately
          </label>
        </div>

        {/* Errors */}
        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* Success */}
        {success && (
          <p className="text-sm text-green-600">
            {success}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </form>
    </div>
  );
}
