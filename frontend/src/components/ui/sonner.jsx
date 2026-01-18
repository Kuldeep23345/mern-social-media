import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();

  // Detect mobile mode
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <Sonner
      theme="light"
      className="toaster group"
      position={isMobile ? "top-left" : "bottom-right"}
      toastOptions={{
        className:
          "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
      }}
      style={{
        "--normal-bg": "#ffffff",
        "--normal-text": "#000000",
        "--normal-border": "#f3f4f6",
      }}
      {...props}
    />
  );
};

export { Toaster };
