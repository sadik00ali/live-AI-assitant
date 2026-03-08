import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  useColorScheme,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BottomNav from "../components/BottomNav";

const { width } = Dimensions.get("window");

export default function PatientDashboard() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [user, setUser] = useState<{ name?: string } | null>(null);
  const [activeTab, setActiveTab] = useState("Home");

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  // Real-time date
  const [currentDate, setCurrentDate] = useState("");
  const [greeting, setGreeting] = useState("Good Morning,");

  useEffect(() => {
    loadUserData();

    // Set date
    const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    setCurrentDate(new Date().toLocaleDateString('en-US', dateOptions));

    // Set greeting based on time
    const currentHour = new Date().getHours();
    if (currentHour < 12) setGreeting("Good Morning,");
    else if (currentHour < 17) setGreeting("Good Afternoon,");
    else setGreeting("Good Evening,");

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleTabPress = (tabName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabName);
    // Routing logic would go here internally later
  };

  const handleCardPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route as any);
  };

  // Menu configuration
  const menuItems = [
    { id: "profile", title: "Profile", icon: "person", library: "Ionicons", color: "#3B82F6", route: "/patient/profile", isHighlight: false },
    { id: "appointments", title: "Appointments", icon: "calendar", library: "Ionicons", color: "#8B5CF6", route: "/patient/appointments", isHighlight: true },
    { id: "prescriptions", title: "Prescriptions", icon: "pill", library: "MaterialCommunityIcons", color: "#F59E0B", route: "/patient/prescriptions", isHighlight: false },
    { id: "lab-reports", title: "Lab Reports", icon: "flask", library: "Ionicons", color: "#10B981", route: "/patient/labreports", isHighlight: false },
    { id: "reminders", title: "Medicine Reminder", icon: "alarm", library: "Ionicons", color: "#EF4444", route: "/patient/medicinereminder", isHighlight: true },
    { id: "disease-predict", title: "Disease Prediction", icon: "pulse", library: "Ionicons", color: "#EC4899", route: "/patient/diseasepredict", isHighlight: false },
    { id: "chatbot", title: "Chatbot", icon: "chatbubbles", library: "Ionicons", color: "#06B6D4", route: "/patient/chatbot", isHighlight: false },
    { id: "doctor-messages", title: "Doctor Messages", icon: "medkit", library: "Ionicons", color: "#6366F1", route: "/patient/doctormessages", isHighlight: true },
  ];

  // Theme configuration (Glassmorphism Tailored)
  const theme = {
    background: isDark ? "#020617" : "#F0F9FF",
    glassTint: isDark ? "dark" : "light" as "dark" | "light" | "default",
    glassIntensity: isDark ? 40 : 80,
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#64748B",
    gradientStart: isDark ? "#1E293B" : "#DBEAFE",
    gradientEnd: isDark ? "#0F172A" : "#EFF6FF",
    cardBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.8)",
    highlightGlow: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
  };

  const renderIcon = (item: typeof menuItems[0]) => {
    if (item.library === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={item.icon as any} size={28} color={item.color} />;
    }
    return <Ionicons name={item.icon as any} size={28} color={item.color} />;
  };


  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <BottomNav activeTab="Home" />
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Soft Ambient Background Orbs */}
      <View style={styles.ambientBackground}>
        <View style={[styles.orb, styles.orbBlue]} />
        <View style={[styles.orb, styles.orbTeal]} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTextContainer}>
              <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                {greeting}
              </Text>
              <Text style={[styles.userName, { color: theme.textPrimary }]}>
                {user?.name || "Praveen"}
              </Text>

              <View style={styles.statusRow}>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  {currentDate}
                </Text>
                <View style={styles.healthDot} />
                <Text style={styles.healthStatusText}>Healthy</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity onPress={() => router.push("/patient/profile")}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=11" }}
                  style={styles.profilePic}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Widgets Section */}
          <View style={styles.widgetsContainer}>
            {/* Upcoming Appointment Widget */}
            <TouchableOpacity activeOpacity={0.8} onPress={() => handleCardPress('/patient/appointments')}>
              <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.widgetCard, { borderColor: theme.cardBorder }]}>
                <LinearGradient
                  colors={["rgba(59, 130, 246, 0.15)", "rgba(59, 130, 246, 0.0)"]}
                  style={styles.widgetGradient}
                >
                  <View style={styles.widgetHeaderRow}>
                    <View style={styles.widgetIconBgBlue}>
                      <Ionicons name="calendar" size={18} color="#3B82F6" />
                    </View>
                    <Text style={styles.widgetTag}>Upcoming Appointment</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: "auto" }} />
                  </View>
                  <View style={styles.widgetMainContent}>
                    <Image source={{ uri: "https://i.pravatar.cc/150?img=32" }} style={styles.doctorThumb} />
                    <View>
                      <Text style={[styles.doctorName, { color: theme.textPrimary }]}>Dr. Sarah Wilson</Text>
                      <Text style={[styles.doctorSpec, { color: theme.textSecondary }]}>Cardiologist</Text>
                    </View>
                  </View>
                  <View style={styles.timeRow}>
                    <Ionicons name="time" size={14} color="#3B82F6" />
                    <Text style={styles.timeText}>Today, 10:30 AM</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>

            {/* Medicine Reminder Preview Widget */}
            <TouchableOpacity activeOpacity={0.8} style={{ marginTop: 12 }} onPress={() => handleCardPress('/patient/medicinereminder')}>
              <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.widgetCard, { borderColor: theme.cardBorder }]}>
                <LinearGradient
                  colors={["rgba(245, 158, 11, 0.15)", "rgba(245, 158, 11, 0.0)"]}
                  style={[styles.widgetGradient, { paddingVertical: 14 }]}
                >
                  <View style={styles.widgetHeaderRow}>
                    <View style={styles.widgetIconBgOrange}>
                      <Ionicons name="alarm" size={18} color="#F59E0B" />
                    </View>
                    <Text style={[styles.widgetTag, { color: "#F59E0B" }]}>Next Medicine</Text>
                    <Text style={styles.medTime}>1:00 PM</Text>
                  </View>
                  <View style={styles.medContent}>
                    <Text style={[styles.medName, { color: theme.textPrimary }]}>Amoxicillin 500mg</Text>
                    <Text style={[styles.medDesc, { color: theme.textSecondary }]}>1 tablet after food</Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* Main Menu Grid Dashboard */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Health Services
          </Text>

          <View style={styles.grid}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.gridCardWrapper}
                activeOpacity={0.7}
                onPress={() => handleCardPress(item.route)}
              >
                <BlurView
                  intensity={theme.glassIntensity}
                  tint={theme.glassTint}
                  style={[
                    styles.glassCard,
                    { borderColor: theme.cardBorder },
                    item.isHighlight && { backgroundColor: theme.highlightGlow }
                  ]}
                >
                  {item.isHighlight && (
                    <View style={[styles.glowEffect, { backgroundColor: item.color }]} />
                  )}
                  <View style={[styles.iconContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)" }]}>
                    {renderIcon(item)}
                  </View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    {item.title}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.scrollPaddingBottom} />
        </Animated.View>
      </ScrollView>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientBackground: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    zIndex: -1,
  },
  orb: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    opacity: 0.4,
    filter: "blur(60px)",
  },
  orbBlue: {
    backgroundColor: "#BAE6FD",
    top: -width * 0.4,
    left: -width * 0.3,
  },
  orbTeal: {
    backgroundColor: "#CCFBF1",
    bottom: -width * 0.2,
    right: -width * 0.4,
  },
  scrollContent: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },
  headerTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "500",
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginHorizontal: 8,
  },
  healthStatusText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  bellIcon: {
    marginRight: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  iconGlass: {
    padding: 10,
    borderRadius: 20,
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1,
    borderColor: "#FFF",
  },
  profilePic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  widgetsContainer: {
    marginBottom: 32,
  },
  widgetCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  widgetGradient: {
    padding: 16,
  },
  widgetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  widgetIconBgBlue: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  widgetIconBgOrange: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  widgetTag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  widgetMainContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  doctorThumb: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  doctorSpec: {
    fontSize: 13,
    fontWeight: "500",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
    color: "#3B82F6",
  },
  medTime: {
    marginLeft: "auto",
    fontSize: 14,
    fontWeight: "700",
    color: "#F59E0B",
  },
  medContent: {
    marginLeft: 36,
  },
  medName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  medDesc: {
    fontSize: 13,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    marginLeft: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridCardWrapper: {
    width: (width - 55) / 2,
    marginBottom: 15,
  },
  glassCard: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    overflow: "hidden",
  },
  glowEffect: {
    position: "absolute",
    top: -20,
    left: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    opacity: 0.15,
    filter: "blur(20px)",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  scrollPaddingBottom: {
    height: 120, // Space for nav bar
  },

});