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
    Image,
    Platform,
    Modal,
    TextInput,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

// Mock Data
const PRESCRIPTIONS = [
    {
        id: "rx-001",
        doctor: "Dr. Sarah Jenkins",
        specialty: "Cardiology",
        hospital: "City Heart Institute",
        date: "10/11/2025",
        diagnosis: "Mild Hypertension",
        doctorImage: "https://i.pravatar.cc/150?img=35",
        advice: "Continue daily walks, reduce sodium intake, and monitor blood pressure weekly.",
        medicines: [
            { name: "Amlodipine", dosage: "5mg", frequency: "1 tablet daily", instructions: "After breakfast" },
            { name: "Aspirin", dosage: "75mg", frequency: "1 tablet daily", instructions: "After dinner" },
        ]
    },
    {
        id: "rx-002",
        doctor: "Dr. Emily Stone",
        specialty: "General Medicine",
        hospital: "Wellness Clinic Center",
        date: "24/10/2024",
        diagnosis: "Viral Pharyngitis",
        doctorImage: "https://i.pravatar.cc/150?img=43",
        advice: "Warm saline gargle 3 times a day. Plenty of oral fluids. Voice rest.",
        medicines: [
            { name: "Paracetamol", dosage: "500mg", frequency: "1 tablet SOS (when fever > 100°F)", instructions: "After food" },
            { name: "Vitamin C", dosage: "500mg", frequency: "1 tablet daily", instructions: "Morning" },
            { name: "Azithromycin", dosage: "250mg", frequency: "1 tablet daily", instructions: "Empty stomach, for 3 days" },
        ]
    },
];

export default function PrescriptionsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [selectedRx, setSelectedRx] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    // Modal Animations
    const modalSlideAnim = useRef(new Animated.Value(height)).current;
    const modalFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
        ]).start();

        const createFloatingAnim = (anim: Animated.Value, duration: number, distance: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, { toValue: distance, duration: duration, useNativeDriver: true }),
                    Animated.timing(anim, { toValue: 0, duration: duration, useNativeDriver: true }),
                ])
            ).start();
        };

        createFloatingAnim(floatAnim1, 4000, 15);
        createFloatingAnim(floatAnim2, 5000, -20);
    }, []);

    const openDetails = (rx: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRx(rx);
        Animated.parallel([
            Animated.spring(modalSlideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
            Animated.timing(modalFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();
    };

    const closeDetails = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.spring(modalSlideAnim, { toValue: height, tension: 50, friction: 10, useNativeDriver: true }),
            Animated.timing(modalFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
        ]).start(() => {
            setSelectedRx(null);
        });
    };

    const theme = {
        bgGradientStart: isDark ? "#020617" : "#E0F2FE",
        bgGradientEnd: isDark ? "#0F172A" : "#F0F9FF",
        glassTint: isDark ? "dark" : "light" as "dark" | "light" | "default",
        glassIntensity: isDark ? 40 : 70,
        textPrimary: isDark ? "#F8FAFC" : "#0F172A",
        textSecondary: isDark ? "#94A3B8" : "#64748B",
        glassBorder: isDark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.7)",
        glassBg: isDark ? "rgba(30, 41, 59, 1)" : "rgba(255, 255, 255, 1)",
        iconColor: isDark ? "#38BDF8" : "#0EA5E9",
        primary: "#0EA5E9",
        success: "#10B981",
    };

    return (
        <View style={styles.container}>
            {/* We only render BottomNav if the modal is NOT stealing the screen. It looks cleaner. */}
            {/* But for accurate navigation logic based on previous screens, we'll keep it mounted. */}
            {/* We'll cover it via styling zIndex if necessary. */}
            {/* Usually Prescriptions might map to 'Dashboard' or a new tab depending on router */}
            <BottomNav activeTab="Dashboard" />
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

            {/* Header Section */}
            <View style={[styles.headerSection, { paddingTop: Platform.OS === 'ios' ? 60 : 45 }]}>
                {isSearchActive ? (
                    <View style={[styles.searchContainer, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}>
                        <Ionicons name="search-outline" size={20} color={theme.textSecondary} />
                        <TextInput
                            style={[styles.searchInput, { color: theme.textPrimary }]}
                            placeholder="Search doctor, diagnosis..."
                            placeholderTextColor={theme.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(""); }}>
                            <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Prescriptions</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>View and download doctor prescriptions</Text>
                    </View>
                )}
                {!isSearchActive && (
                    <View style={styles.headerIconsRow}>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}
                            onPress={() => setIsSearchActive(true)}
                        >
                            <Ionicons name="search-outline" size={22} color={theme.textPrimary} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.iconBtn, { backgroundColor: sortOrder === "oldest" ? theme.primary : theme.glassBg, borderColor: theme.glassBorder, marginLeft: 10 }]}
                            onPress={() => setSortOrder(prev => prev === "newest" ? "oldest" : "newest")}
                        >
                            <Ionicons name="filter-outline" size={22} color={sortOrder === "oldest" ? "#FFF" : theme.textPrimary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {PRESCRIPTIONS.filter(rx => {
                        const s = searchQuery.toLowerCase();
                        return rx.doctor.toLowerCase().includes(s) ||
                            rx.diagnosis.toLowerCase().includes(s) ||
                            rx.hospital.toLowerCase().includes(s);
                    }).sort((a, b) => {
                        // Parse DD/MM/YYYY strings to Date objects
                        const [dayA, monthA, yearA] = a.date.split("/");
                        const [dayB, monthB, yearB] = b.date.split("/");

                        const timeA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA)).getTime();
                        const timeB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB)).getTime();

                        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
                    }).map((rx) => (
                        <BlurView key={rx.id} intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                            <View style={styles.cardHeaderRow}>
                                <Image source={{ uri: rx.doctorImage }} style={styles.doctorAvatarClipped} />
                                <View style={styles.doctorInfoCol}>
                                    <Text style={[styles.cardDoctorName, { color: theme.textPrimary }]}>{rx.doctor}</Text>
                                    <Text style={[styles.cardDoctorSpec, { color: theme.primary }]}>{rx.specialty}</Text>
                                </View>
                                <View style={styles.dateBadge}>
                                    <Text style={[styles.dateBadgeText, { color: theme.textSecondary }]}>{rx.date}</Text>
                                </View>
                            </View>

                            <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                            <View style={styles.diagnosisRow}>
                                <Ionicons name="medical" size={16} color={theme.success} />
                                <Text style={[styles.diagnosisText, { color: theme.textPrimary }]} numberOfLines={1}>
                                    <Text style={{ fontWeight: '600' }}>Diagnosis:</Text> {rx.diagnosis}
                                </Text>
                            </View>

                            <View style={styles.medicinePreviewBox}>
                                <Text style={[styles.medicinePreviewLabel, { color: theme.textSecondary }]}>Prescribed Medicines:</Text>
                                <Text style={[styles.medicinePreviewText, { color: theme.textPrimary }]} numberOfLines={1}>
                                    {rx.medicines.map(m => m.name).join(", ")}
                                </Text>
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]}
                                    onPress={() => openDetails(rx)}
                                >
                                    <Ionicons name="eye-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.actionBtnPrimaryText}>View Details</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: theme.primary, borderWidth: 1 }]}>
                                    <Ionicons name="download-outline" size={18} color={theme.primary} />
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    ))}
                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* Details Modal Overlay */}
            {selectedRx && (
                <Animated.View style={[styles.modalOverlay, { opacity: modalFadeAnim }]}>
                    {/* Dark backdrop */}
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDetails}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.modalContentWrapper,
                        {
                            transform: [{ translateY: modalSlideAnim }],
                        }
                    ]}>
                        <BlurView intensity={theme.glassIntensity + 20} tint={theme.glassTint} style={[styles.modalGlassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                            {/* Modal Pull Bar */}
                            <View style={styles.pullBarContainer} {...{ onTouchStart: closeDetails }}>
                                <View style={[styles.pullBar, { backgroundColor: theme.textSecondary }]} />
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                {/* Doctor Info Header */}
                                <View style={styles.modalDocHeader}>
                                    <Image source={{ uri: selectedRx.doctorImage }} style={styles.modalDocAvatar} />
                                    <View style={{ flex: 1, marginLeft: 15 }}>
                                        <Text style={[styles.modalDocName, { color: theme.textPrimary }]}>{selectedRx.doctor}</Text>
                                        <Text style={[styles.modalDocHospital, { color: theme.textSecondary }]}>{selectedRx.hospital}</Text>
                                    </View>
                                    <View style={[styles.modalDateBadge, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                                        <Text style={[styles.modalDateText, { color: theme.primary }]}>{selectedRx.date}</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: theme.glassBorder, marginVertical: 20 }]} />

                                {/* Diagnosis */}
                                <View style={styles.modalSection}>
                                    <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>Diagnosis</Text>
                                    <View style={[styles.infoBox, { backgroundColor: "rgba(0,0,0,0.03)" }]}>
                                        <Text style={[styles.infoBoxText, { color: theme.textPrimary }]}>{selectedRx.diagnosis}</Text>
                                    </View>
                                </View>

                                {/* Medicines List */}
                                <View style={styles.modalSection}>
                                    <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>Medicines</Text>
                                    {selectedRx.medicines.map((med: any, index: number) => (
                                        <View key={index} style={[styles.medicineCard, { borderColor: theme.glassBorder, backgroundColor: "rgba(255,255,255,0.05)" }]}>
                                            <View style={styles.medIconBox}>
                                                <MaterialCommunityIcons name="pill" size={24} color={theme.primary} />
                                            </View>
                                            <View style={styles.medContentCol}>
                                                <View style={styles.medHeaderRow}>
                                                    <Text style={[styles.medName, { color: theme.textPrimary }]}>{med.name}</Text>
                                                    <Text style={[styles.medDosage, { color: theme.primary }]}>{med.dosage}</Text>
                                                </View>
                                                <Text style={[styles.medFreq, { color: theme.textSecondary }]}>{med.frequency}</Text>
                                                <View style={[styles.medInstructionRow, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                                                    <Ionicons name="information-circle-outline" size={14} color={theme.success} />
                                                    <Text style={[styles.medInstructionText, { color: theme.success }]}>{med.instructions}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>

                                {/* Doctor Advice */}
                                <View style={styles.modalSection}>
                                    <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>Doctor's Advice</Text>
                                    <View style={[styles.infoBox, { backgroundColor: "rgba(0,0,0,0.03)", flexDirection: 'row', alignItems: 'flex-start' }]}>
                                        <Ionicons name="chatbubbles-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10, marginTop: 2 }} />
                                        <Text style={[styles.infoBoxText, { color: theme.textPrimary, flex: 1, lineHeight: 22 }]}>{selectedRx.advice}</Text>
                                    </View>
                                </View>

                            </ScrollView>

                            {/* Sticky Bottom Actions */}
                            <View style={[styles.modalBottomActions, { borderTopColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                                <TouchableOpacity style={[styles.modalBtnShare, { borderColor: theme.primary }]}>
                                    <Ionicons name="share-social-outline" size={20} color={theme.primary} />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalBtnDownload, { backgroundColor: theme.primary }]}>
                                    <Ionicons name="download-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.modalBtnDownloadText}>Download PDF</Text>
                                </TouchableOpacity>
                            </View>
                        </BlurView>
                    </Animated.View>
                </Animated.View>
            )}
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
        top: -width * 0.1,
        left: -width * 0.2,
    },
    orb2: {
        width: width * 1.1,
        height: width * 1.1,
        backgroundColor: "rgba(45, 212, 191, 0.12)",
        bottom: height * 0.1,
        right: -width * 0.3,
    },
    headerSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "bold",
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    headerIconsRow: {
        flexDirection: "row",
    },
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    searchContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 22,
        borderWidth: 1,
        paddingHorizontal: 15,
        height: 44,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 15,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    glassCard: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        marginBottom: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    cardHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    doctorAvatarClipped: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#E2E8F0",
    },
    doctorInfoCol: {
        flex: 1,
        marginLeft: 15,
    },
    cardDoctorName: {
        fontSize: 16,
        fontWeight: "700",
    },
    cardDoctorSpec: {
        fontSize: 13,
        fontWeight: "500",
        marginTop: 2,
    },
    dateBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: "rgba(0,0,0,0.03)",
        borderRadius: 8,
    },
    dateBadgeText: {
        fontSize: 12,
        fontWeight: "600",
    },
    divider: {
        height: 1,
        width: "100%",
        marginVertical: 15,
    },
    diagnosisRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    diagnosisText: {
        fontSize: 15,
        marginLeft: 8,
        flex: 1,
    },
    medicinePreviewBox: {
        backgroundColor: "rgba(0,0,0,0.02)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    medicinePreviewLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    medicinePreviewText: {
        fontSize: 14,
        fontWeight: "500",
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
    },
    actionBtnPrimary: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    actionBtnPrimaryText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "600",
    },
    actionBtnOutline: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },

    /* Details Modal Styles */
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "flex-end",
        zIndex: 100,
    },
    modalBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    modalContentWrapper: {
        width: "100%",
        height: height * 0.85,
    },
    modalGlassCard: {
        flex: 1,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        borderWidth: 1,
        borderBottomWidth: 0,
        overflow: "hidden",
    },
    pullBarContainer: {
        width: "100%",
        height: 30,
        alignItems: "center",
        justifyContent: "center",
    },
    pullBar: {
        width: 40,
        height: 5,
        borderRadius: 3,
        opacity: 0.5,
    },
    modalDocHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 25,
        marginTop: 5,
    },
    modalDocAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#E2E8F0",
    },
    modalDocName: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 2,
    },
    modalDocHospital: {
        fontSize: 14,
    },
    modalDateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    modalDateText: {
        fontSize: 13,
        fontWeight: "bold",
    },
    modalSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    infoBox: {
        padding: 16,
        borderRadius: 16,
    },
    infoBoxText: {
        fontSize: 15,
        fontWeight: "500",
    },
    medicineCard: {
        flexDirection: "row",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    medIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    medContentCol: {
        flex: 1,
    },
    medHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    medName: {
        fontSize: 16,
        fontWeight: "700",
    },
    medDosage: {
        fontSize: 14,
        fontWeight: "bold",
    },
    medFreq: {
        fontSize: 13,
        marginBottom: 8,
    },
    medInstructionRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    medInstructionText: {
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 6,
    },
    modalBottomActions: {
        flexDirection: "row",
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
    },
    modalBtnShare: {
        width: 56,
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    modalBtnDownload: {
        flex: 1,
        flexDirection: "row",
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    modalBtnDownloadText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
});
