import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Toaster } from "sonner";
import Home from "@/pages/Home";
import RoomDetail from "@/pages/RoomDetail";

// The viewport meta tag (user-scalable=no) covers pinch/double-tap zoom
// on mobile, but browsers deliberately don't let a page block zoom via
// that route alone on desktop — ctrl+scroll (and trackpad pinch, which
// browsers report as a wheel event with ctrlKey set) and the
// ctrl/cmd +/-/0 shortcuts need their own handlers. This is this app's
// floorplan: zooming the whole page fights the SVG's own full-viewport
// layout and zoom-to-room animation, so disabling it is intentional
// here, not a general pattern to reach for elsewhere.
function useDisablePageZoom() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const isZoomKey = e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0";
      if ((e.ctrlKey || e.metaKey) && isZoomKey) e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

export default function App() {
  useDisablePageZoom();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rooms/:slug" element={<RoomDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="bottom-right" richColors />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
