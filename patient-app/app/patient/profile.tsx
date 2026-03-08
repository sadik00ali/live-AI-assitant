import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    Animated,
    useColorScheme,
    Image,
    Platform,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

export default function PatientProfile() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [user, setUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Editable State
    const [editableInfo, setEditableInfo] = useState({
        name: "Praveen",
        phone: "+1 (555) 123-4567",
        email: "praveen@example.com",
        dob: "12 Oct 1991",
        address: "123 Health Ave, Wellness City",
        height: "175 cm",
        weight: "72 kg",
        allergies: "Penicillin, Peanuts",
        chronicDiseases: "None",
        medications: "Vitamin D, Omega 3",
        password: "123",
    });

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;

    // Float animation for orbs
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadUserData();

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 40,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        const createFloatingAnim = (anim: Animated.Value, duration: number, distance: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: distance,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: duration,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        createFloatingAnim(floatAnim1, 4000, 15);
        createFloatingAnim(floatAnim2, 5000, -20);
    }, []);

    const loadUserData = async () => {
        try {
            const userData = await AsyncStorage.getItem("user");
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                setEditableInfo(prev => ({
                    ...prev,
                    name: parsedUser.name || prev.name,
                    email: parsedUser.email || prev.email,
                }));
            }
        } catch (error) {
            console.error("Error loading user data:", error);
        }
    };

    const handleLogout = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            "Logout",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Logout",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("token");
                        await AsyncStorage.removeItem("user");
                        router.replace("/");
                    }
                }
            ]
        );
    };

    const toggleEdit = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (isEditing) {
            // Logic to save profile details locally or via API would go here
            Alert.alert("Success", "Profile information updated.");
        }
        setIsEditing(!isEditing);
    };

    const handleEditChange = (key: keyof typeof editableInfo, value: string) => {
        setEditableInfo(prev => ({ ...prev, [key]: value }));
    };

    const theme = {
        bgGradientStart: isDark ? "#020617" : "#E0F2FE",
        bgGradientEnd: isDark ? "#0F172A" : "#F0F9FF",
        glassTint: isDark ? "dark" : "light" as "dark" | "light" | "default",
        glassIntensity: isDark ? 40 : 70,
        textPrimary: isDark ? "#F8FAFC" : "#0F172A",
        textSecondary: isDark ? "#94A3B8" : "#64748B",
        glassBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.6)",
        glassBg: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 1)",
        iconColor: isDark ? "#38BDF8" : "#0EA5E9",
        dangerBtn: "#EF4444",
        inputBorderActive: "#0EA5E9",
        inputBg: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.5)",
    };

    // Static Mock Data
    const profileInfo = {
        id: "PAT-84920",
        age: "32 yrs",
        gender: "Male",
        bloodGroup: "O+",
        emergencyContact: "Sarah Wilson",
        emergencyRelation: "Spouse",
        emergencyPhone: "+1 (555) 987-6543",
        appointments: 3,
        labReports: 12,
        prescriptions: 5,
        activeMeds: 2,
    };

    const renderInfoRow = (label: string, value: string, editKey: keyof typeof editableInfo, isLast = false) => {
        return (
            <View style={[styles.infoRow, isLast && { borderBottomWidth: 0, paddingBottom: 0 }]}>
                <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
                {isEditing ? (
                    <TextInput
                        style={[
                            styles.inputEdit,
                            {
                                color: theme.textPrimary,
                                borderColor: theme.inputBorderActive,
                                backgroundColor: theme.inputBg,
                                textAlign: 'right',
                                flex: 1,
                                marginLeft: 20
                            }
                        ]}
                        value={value}
                        onChangeText={(text) => handleEditChange(editKey, text)}
                        placeholderTextColor={theme.textSecondary}
                    />
                ) : (
                    <Text style={[styles.infoValue, { color: theme.textPrimary, textAlign: 'right', flex: 1, marginLeft: 20 }]}>{value}</Text>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <BottomNav activeTab="Profile" />
            <StatusBar style={isDark ? "light" : "dark"} />

            {/* Background Gradients */}
            <LinearGradient
                colors={[theme.bgGradientStart, theme.bgGradientEnd]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />

            {/* Ambient Orbs */}
            <View style={styles.ambientBackground}>
                <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: floatAnim1 }] }]} />
                <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: floatAnim2 }] }]} />
            </View>

            {/* Header bar */}
            <View style={[styles.navHeader, { paddingTop: Platform.OS === 'ios' ? 55 : 45 }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Patient Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {/* Profile Header Card */}
                    <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarContainer}>
                                <Image source={{ uri: "https://i.pravatar.cc/150?img=11" }} style={styles.avatar} />
                                <View style={[styles.onlineIndicator, { borderColor: theme.glassBg }]} />
                            </View>
                            <Text style={[styles.nameText, { color: theme.textPrimary }]}>{editableInfo.name}</Text>
                            <Text style={[styles.idText, { color: theme.iconColor }]}>ID: {profileInfo.id}</Text>

                            <View style={styles.quickStatsRow}>
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{profileInfo.age}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Age</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: theme.textPrimary }]}>{profileInfo.gender}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Gender</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statBox}>
                                    <Text style={[styles.statValue, { color: "#EF4444" }]}>{profileInfo.bloodGroup}</Text>
                                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Blood</Text>
                                </View>
                            </View>
                        </View>
                    </BlurView>

                    {/* Section: Personal Information */}
                    <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="person" size={20} color={theme.iconColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Personal Information</Text>
                        </View>

                        {renderInfoRow("Full Name", editableInfo.name, "name")}
                        {renderInfoRow("Phone Number", editableInfo.phone, "phone")}
                        {renderInfoRow("Email", editableInfo.email, "email")}
                        {renderInfoRow("Date of Birth", editableInfo.dob, "dob")}
                        {renderInfoRow("Address", editableInfo.address, "address", true)}
                        <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Password</Text>
                            <View style={styles.passwordContainer}>
                                {isEditing ? (
                                    <TextInput
                                        style={[
                                            styles.inputEdit,
                                            {
                                                color: theme.textPrimary,
                                                borderColor: theme.inputBorderActive,
                                                backgroundColor: theme.inputBg,
                                                flex: 1,
                                            }
                                        ]}
                                        secureTextEntry={!showPassword}
                                        value={editableInfo.password || ""}
                                        onChangeText={(text) => handleEditChange("password", text)}
                                        placeholderTextColor={theme.textSecondary}
                                        placeholder="••••••••"
                                    />
                                ) : (
                                    <Text style={[styles.infoValue, { color: theme.textPrimary, flex: 1, marginLeft: 20 }]}>
                                        {showPassword ? (editableInfo.password || "••••••••") : "••••••••"}
                                    </Text>
                                )}
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconBtn}>
                                    <Ionicons
                                        name={showPassword ? "eye" : "eye-off"}
                                        size={20}
                                        color={theme.iconColor}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </BlurView>

                    {/* Section: Medical Information */}
                    <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.sectionHeader}>
                            <MaterialCommunityIcons name="medical-bag" size={20} color={theme.iconColor} />
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Medical Information</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Blood Group</Text>
                            <Text style={[styles.infoValue, { color: "#EF4444", fontWeight: 'bold', marginLeft: 20, textAlign: 'right', flex: 1 }]}>{profileInfo.bloodGroup}</Text>
                        </View>
                        {renderInfoRow("Height", editableInfo.height, "height")}
                        {renderInfoRow("Weight", editableInfo.weight, "weight")}
                        {renderInfoRow("Allergies", editableInfo.allergies, "allergies")}
                        {renderInfoRow("Chronic Diseases", editableInfo.chronicDiseases, "chronicDiseases")}
                        {renderInfoRow("Current Meds", editableInfo.medications, "medications", true)}
                    </BlurView>

                    {/* Section: Emergency Contact */}
                    <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="call" size={20} color="#EF4444" />
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Emergency Contact</Text>
                        </View>
                        <View style={styles.emergencyContainer}>
                            <View style={styles.emergencyBadge}>
                                <Ionicons name="warning" size={24} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={[styles.emergencyName, { color: theme.textPrimary }]}>{profileInfo.emergencyContact}</Text>
                                <Text style={[styles.emergencyRel, { color: theme.textSecondary }]}>{profileInfo.emergencyRelation}</Text>
                                <Text style={[styles.emergencyPhone, { color: theme.iconColor }]}>{profileInfo.emergencyPhone}</Text>
                            </View>
                            <TouchableOpacity style={styles.callButton}>
                                <Ionicons name="call" size={20} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </BlurView>

                    {/* Section: Health Summary Grid */}
                    <Text style={[styles.summaryTitle, { color: theme.textPrimary }]}>Health Summary</Text>
                    <View style={styles.summaryGrid}>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.summaryCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <Ionicons name="calendar" size={24} color="#8B5CF6" />
                            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{profileInfo.appointments}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Appointments</Text>
                        </BlurView>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.summaryCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <Ionicons name="flask" size={24} color="#10B981" />
                            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{profileInfo.labReports}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Lab Reports</Text>
                        </BlurView>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.summaryCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <MaterialCommunityIcons name="pill" size={24} color="#F59E0B" />
                            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{profileInfo.prescriptions}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Prescriptions</Text>
                        </BlurView>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.summaryCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <Ionicons name="medical" size={24} color="#0EA5E9" />
                            <Text style={[styles.summaryCount, { color: theme.textPrimary }]}>{profileInfo.activeMeds}</Text>
                            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Active Meds</Text>
                        </BlurView>
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={toggleEdit}>
                            <BlurView
                                intensity={theme.glassIntensity}
                                tint={theme.glassTint}
                                style={[
                                    styles.buttonGlass,
                                    {
                                        borderColor: isEditing ? "#10B981" : theme.glassBorder,
                                        backgroundColor: isEditing ? "rgba(16, 185, 129, 0.1)" : "transparent"
                                    }
                                ]}>
                                <Ionicons name={isEditing ? "checkmark-circle" : "create-outline"} size={20} color={isEditing ? "#10B981" : theme.textPrimary} />
                                <Text style={[styles.buttonText, { color: isEditing ? "#10B981" : theme.textPrimary, fontWeight: isEditing ? "bold" : "600" }]}>
                                    {isEditing ? "Save Changes" : "Edit Profile"}
                                </Text>
                            </BlurView>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.buttonGlass, { borderColor: "rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                                <Text style={[styles.buttonText, { color: "#EF4444", fontWeight: "bold" }]}>Logout</Text>
                            </BlurView>
                        </TouchableOpacity>
                    </View>

                    <View style={{ height: 100 }} />
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
    },
    orb: {
        position: "absolute",
        borderRadius: 999,
        filter: "blur(50px)",
    },
    orb1: {
        width: width * 0.9,
        height: width * 0.9,
        backgroundColor: "rgba(14, 165, 233, 0.15)",
        top: -width * 0.2,
        right: -width * 0.2,
    },
    orb2: {
        width: width * 1.1,
        height: width * 1.1,
        backgroundColor: "rgba(45, 212, 191, 0.12)",
        bottom: -width * 0.1,
        left: -width * 0.3,
    },
    navHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingBottom: 15,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    passwordContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 2,
        justifyContent: "flex-end",
    },
    eyeIconBtn: {
        marginLeft: 10,
        padding: 5,
    },
    glassCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        marginBottom: 20,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    profileHeader: {
        alignItems: "center",
    },
    avatarContainer: {
        position: "relative",
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "rgba(255,255,255,0.5)",
    },
    onlineIndicator: {
        position: "absolute",
        bottom: 5,
        right: 5,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: "#10B981",
        borderWidth: 3,
    },
    nameText: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 4,
    },
    idText: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 20,
    },
    quickStatsRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.03)",
        borderRadius: 16,
        paddingVertical: 12,
    },
    statBox: {
        flex: 1,
        alignItems: "center",
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: "rgba(150,150,150,0.2)",
    },
    statValue: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 12,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginLeft: 10,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(150,150,150,0.1)",
        minHeight: 45,
    },
    infoLabel: {
        fontSize: 14,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "500",
    },
    inputEdit: {
        fontSize: 14,
        fontWeight: "500",
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderRadius: 8,
        minWidth: 150,
    },
    emergencyContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.02)",
        padding: 16,
        borderRadius: 16,
    },
    emergencyBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(245, 158, 11, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    emergencyName: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
    },
    emergencyRel: {
        fontSize: 13,
        marginBottom: 2,
    },
    emergencyPhone: {
        fontSize: 14,
        fontWeight: "600",
    },
    callButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#EF4444",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#EF4444",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
        marginLeft: 4,
    },
    summaryGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    summaryCard: {
        width: (width - 55) / 2,
        padding: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 15,
        alignItems: "center",
    },
    summaryCount: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 10,
        marginBottom: 2,
    },
    summaryLabel: {
        fontSize: 13,
    },
    actionButtonsContainer: {
        marginTop: 10,
        gap: 12,
    },
    secondaryButton: {
        overflow: 'hidden',
        borderRadius: 16,
    },
    buttonGlass: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderWidth: 1,
        borderRadius: 16,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
        marginLeft: 10,
    },
    logoutButton: {
        overflow: 'hidden',
        borderRadius: 16,
        marginTop: 8,
        marginBottom: 20,
    },
});
