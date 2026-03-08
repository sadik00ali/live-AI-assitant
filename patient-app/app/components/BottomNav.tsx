import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

const navItems = [
    { name: "Home", icon: "home", route: "/patient/patientdashboard" },
    { name: "APPT", icon: "calendar", route: "/patient/appointments" },
    { name: "Medicines", icon: "medical", route: "/patient/medicinereminder" },
    { name: "Chat", icon: "chatbubbles", route: "/patient/chatbot" },
    { name: "Profile", icon: "person", route: "/patient/profile" },
];

export default function BottomNav({ activeTab }: { activeTab: string }) {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

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

    const handleTabPress = (nav: typeof navItems[0]) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (activeTab !== nav.name) {
            router.push(nav.route as any);
        }
    };

    return (
        <View style={styles.navBarWrapper}>
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.navBar, { borderColor: theme.cardBorder }]}>
                {navItems.map((nav) => {
                    const isActive = activeTab === nav.name;
                    return (
                        <TouchableOpacity
                            key={nav.name}
                            style={styles.navItem}
                            onPress={() => handleTabPress(nav)}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={isActive ? nav.icon as any : `${nav.icon}-outline` as any}
                                size={24}
                                color={isActive ? "#3B82F6" : theme.textSecondary}
                            />
                            <Text style={[
                                styles.navLabel,
                                { color: isActive ? "#3B82F6" : theme.textSecondary, fontWeight: isActive ? "600" : "400" }
                            ]}>
                                {nav.name}
                            </Text>
                            {isActive && <View style={styles.navIndicator} />}
                        </TouchableOpacity>
                    );
                })}
            </BlurView>
        </View>
    );
}

const styles = StyleSheet.create({
    navBarWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 34 : 20,
        paddingTop: 10,
        zIndex: 100,
    },
    navBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1,
        overflow: "hidden",
    },
    navItem: {
        alignItems: "center",
        justifyContent: "center",
        width: 60,
    },
    navLabel: {
        fontSize: 10,
        marginTop: 4,
    },
    navIndicator: {
        position: "absolute",
        bottom: -10,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#3B82F6",
    },
});