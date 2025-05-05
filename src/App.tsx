import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import { AnnouncementProvider } from "./contexts/AnnouncementContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ZegoProvider } from "./contexts/ZegoContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <AnnouncementProvider>
            <SettingsProvider>
              <ZegoProvider>
                <TooltipProvider>
                  <AppRoutes />
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </ZegoProvider>
            </SettingsProvider>
          </AnnouncementProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
