import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ChatProvider } from "./contexts/ChatContext";
import { AnnouncementProvider } from "./contexts/AnnouncementContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { LiveKitProvider } from "./contexts/LiveKitContext";
import { ChannelProvider } from "./contexts/ChannelContext";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";
import { FontLoader } from "@/components/FontLoader";

const App = () => (
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <AnnouncementProvider>
            <SettingsProvider>
              <LiveKitProvider>
                <ChannelProvider>
                <TooltipProvider>
                  <FontLoader />
                  <AppRoutes />
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
                </ChannelProvider>
              </LiveKitProvider>
            </SettingsProvider>
          </AnnouncementProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
