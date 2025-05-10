import React from 'react';
import { Button } from '@/components/ui/button';
import { useZego } from '@/contexts/ZegoContext';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const CheckZegoButton = () => {
  const checkZegoSetup = () => {
    console.log("Checking Zego setup...");
    
    // Check environment variables
    const appID = import.meta.env.VITE_ZEGO_APP_ID;
    const serverSecret = import.meta.env.VITE_ZEGO_SERVER_SECRET;
    
    console.log("Environment variables:", {
      VITE_ZEGO_APP_ID: appID ? "✅ Set" : "❌ Missing",
      VITE_ZEGO_SERVER_SECRET: serverSecret ? "✅ Set" : "❌ Missing",
      appIdType: typeof appID
    });
    
    // Try to use the Zego SDK
    try {
      const testRoomId = "test_room_" + Date.now();
      const testUserId = "test_user_" + Date.now();
      
      if (!appID || !serverSecret) {
        console.error("Missing Zego credentials");
        return;
      }
      
      const token = ZegoUIKitPrebuilt.generateKitTokenForTest(
        parseInt(appID),
        serverSecret,
        testRoomId,
        testUserId,
        "Test User"
      );
      
      console.log("Successfully generated Zego token:", !!token);
      
      // Check if useZego hook is available
      try {
        const zego = useZego();
        console.log("Zego context available:", zego);
      } catch (error) {
        console.error("Failed to use Zego context:", error);
      }
      
    } catch (error) {
      console.error("Failed to use Zego SDK:", error);
    }
  };
  
  return (
    <Button 
      variant="outline" 
      onClick={checkZegoSetup}
      className="mt-2"
    >
      Debug Call Feature
    </Button>
  );
};

export default CheckZegoButton; 