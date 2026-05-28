import { Building2 } from "lucide-react";

export default function Logo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <div className={`gradient-brand rounded-xl flex items-center justify-center ${className}`}>
      <Building2 className="w-5/12 h-5/12 text-white" strokeWidth={2.5} />
    </div>
  );
}