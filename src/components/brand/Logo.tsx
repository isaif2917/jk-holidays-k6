import logo from "@/assets/jk-logo.png";

export function Logo({ variant: _variant = "light", className = "h-14" }: { variant?: "light" | "dark"; className?: string }) {
  return <img src={logo} alt="JK Holidays — Journey Beyond Expectations" className={`${className} w-auto object-contain`} />;
}
