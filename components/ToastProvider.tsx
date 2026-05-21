/* This component provides a toast notification system using react-hot-toast.
   It should be imported and used at the root of the application (e.g., in layout.tsx)
   to make toast notifications available throughout the application. */

"use client";

import { Toaster } from "react-hot-toast";

import React from "react";

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
