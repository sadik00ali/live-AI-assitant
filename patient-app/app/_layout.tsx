import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { useFonts } from "expo-font";

export default function RootLayout() {

  // ✅ Load Inter fonts globally
  const [fontsLoaded] = useFonts({
    "Inter-Regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
    "Inter-SemiBold": require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
  });

  // ✅ Prevent app from rendering before fonts load
  if (!fontsLoaded) {
    return <Text>Loading...</Text>;
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* Login Screen */}
        <Stack.Screen name="index" />

        {/* Patient Dashboard */}
        <Stack.Screen name="patient/patientdashboard" options={{ headerShown: false }} />
        <Stack.Screen name="patient/chatbot" options={{ headerShown: false }} />
        <Stack.Screen name="patient/medicine" options={{ headerShown: false }} />

        {/* Optional modal */}
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal" }}
        />
      </Stack>

      <StatusBar style="auto" />
    </>
  );
}
