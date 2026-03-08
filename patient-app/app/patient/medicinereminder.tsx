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
    TextInput,
    Platform,
    KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import BottomNav from "../components/BottomNav";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const { width, height } = Dimensions.get("window");

// Mock Data
const MY_MEDICINES = [
    {
        id: "m-1",
        name: "Vitamin D3",
        dosage: "1000 IU",
        time: "08:00 AM",
        instructions: "After Breakfast",
        status: "Taken", // Pending, Taken, Missed
    },
    {
        id: "m-2",
        name: "Iron Supplement",
        dosage: "50mg",
        time: "01:57 AM",
        instructions: "After Lunch",
        status: "Pending",
    },
    {
        id: "m-3",
        name: "Melatonin",
        dosage: "3mg",
        time: "10:00 PM",
        instructions: "Before Sleep",
        status: "Missed",
    }
];

const PRESCRIPTIONS_MEDS = [
    {
        id: "pm-1",
        name: "Amlodipine",
        doctor: "Dr. Sarah Jenkins",
        dosage: "5mg",
        frequency: "1 tablet daily",
        duration: "30 Days",
    },
    {
        id: "pm-2",
        name: "Azithromycin",
        doctor: "Dr. Emily Stone",
        dosage: "250mg",
        frequency: "1 tablet daily",
        duration: "3 Days",
    }
];

export default function MedicineReminderScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [activeTab, setActiveTab] = useState<"My Medicines" | "Prescription">("My Medicines");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Add Form State
    const [formName, setFormName] = useState("");
    const [formDosage, setFormDosage] = useState("");
    const [formFrequency, setFormFrequency] = useState("");
    const [formTime, setFormTime] = useState("");
    const [formStartDate, setFormStartDate] = useState("");
    const [formEndDate, setFormEndDate] = useState("");
    const [formNotes, setFormNotes] = useState("");

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const modalSlideAnim = useRef(new Animated.Value(height)).current;
    const modalFadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const requestPermissions = async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                console.log('Notification permissions not granted');
            }
        };
        requestPermissions();

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

    const openAddModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsAddModalOpen(true);
        Animated.parallel([
            Animated.spring(modalSlideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
            Animated.timing(modalFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true })
        ]).start();
    };

    const scheduleMedicineNotification = async (medicineName: string, timeString: string) => {
        try {
            const [time, period] = timeString.split(' ');
            const [hourStr, minuteStr] = time.split(':');
            let hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            if (period === 'PM' && hour !== 12) {
                hour += 12;
            } else if (period === 'AM' && hour === 12) {
                hour = 0;
            }

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Medicine Reminder",
                    body: `Time to take ${medicineName}`,
                    sound: true,
                },
                trigger: {
                    hour: hour,
                    minute: minute,
                    repeats: true,
                },
            });
            console.log(`Scheduled daily notification for ${medicineName} at ${hour}:${minute}`);
        } catch (e) {
            console.log("Error scheduling notification", e);
        }
    };

    const handleSaveReminder = () => {
        if (formName && formTime) {
            scheduleMedicineNotification(formName, formTime);
        }
        closeAddModal();
    };

    const closeAddModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.parallel([
            Animated.spring(modalSlideAnim, { toValue: height, tension: 50, friction: 10, useNativeDriver: true }),
            Animated.timing(modalFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true })
        ]).start(() => {
            setIsAddModalOpen(false);
            // Reset Form
            setFormName(""); setFormDosage(""); setFormFrequency(""); setFormTime("");
            setFormStartDate(""); setFormEndDate(""); setFormNotes("");
        });
    };

    const handleAction = (type: string) => {
        Haptics.notificationAsync(
            type === 'delete' ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success
        );
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
        warning: "#F59E0B",
        danger: "#EF4444"
    };

    const renderMyMedicines = () => (
        <View>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Today's Schedule</Text>
            {MY_MEDICINES.map((med) => {
                let statusColor = theme.warning;
                if (med.status === "Taken") statusColor = theme.success;
                if (med.status === "Missed") statusColor = theme.danger;

                return (
                    <BlurView key={med.id} intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.cardHeaderRow}>
                            <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
                            <Text style={[styles.medTime, { color: theme.textPrimary }]}>{med.time}</Text>
                            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                                <Text style={[styles.statusText, { color: statusColor }]}>{med.status}</Text>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                        <View style={styles.medContentRow}>
                            <View style={[styles.iconBox, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                                <MaterialCommunityIcons name="pill" size={24} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={[styles.medName, { color: theme.textPrimary }]} numberOfLines={1}>{med.name}</Text>
                                <Text style={[styles.medDosage, { color: theme.textSecondary }]}>{med.dosage}</Text>
                            </View>
                        </View>

                        <View style={[styles.instructionsRow, { backgroundColor: "rgba(0,0,0,0.02)", borderColor: theme.glassBorder }]}>
                            <Ionicons name="restaurant-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.instructionsText, { color: theme.textSecondary }]}>{med.instructions}</Text>
                        </View>

                        <View style={styles.actionRow}>
                            {med.status === "Pending" ? (
                                <>
                                    <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: theme.success }]} onPress={() => handleAction('taken')}>
                                        <Ionicons name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.actionBtnPrimaryText}>Mark Taken</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: theme.textSecondary, borderWidth: 1 }]} onPress={() => handleAction('skip')}>
                                        <Text style={[styles.actionBtnOutlineText, { color: theme.textSecondary }]}>Skip</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <TouchableOpacity style={[styles.actionBtnOutline, { flex: 1, borderColor: theme.primary, borderWidth: 1 }]} onPress={() => handleAction('edit')}>
                                        <Ionicons name="pencil" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                                        <Text style={[styles.actionBtnOutlineText, { color: theme.primary }]}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.actionBtnOutline, { flex: 1, borderColor: theme.danger, borderWidth: 1 }]} onPress={() => handleAction('delete')}>
                                        <Ionicons name="trash-outline" size={16} color={theme.danger} style={{ marginRight: 6 }} />
                                        <Text style={[styles.actionBtnOutlineText, { color: theme.danger }]}>Delete</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </BlurView>
                );
            })}
        </View>
    );

    const renderPrescriptionMeds = () => (
        <View>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Doctor Prescribed</Text>
            {PRESCRIPTIONS_MEDS.map((med) => (
                <BlurView key={med.id} intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                    <View style={styles.medContentRow}>
                        <View style={[styles.iconBox, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                            <Ionicons name="medical-outline" size={24} color={theme.success} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.medName, { color: theme.textPrimary }]} numberOfLines={1}>{med.name}</Text>
                            <Text style={[styles.medDosage, { color: theme.textSecondary }]}>{med.dosage} • {med.frequency}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                    <View style={styles.doctorInfoRow}>
                        <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.prescriberText, { color: theme.textSecondary }]}>Prescribed by {med.doctor}</Text>
                    </View>
                    <View style={styles.doctorInfoRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.prescriberText, { color: theme.textSecondary }]}>Duration: {med.duration}</Text>
                    </View>

                    <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: theme.primary, marginTop: 15 }]}>
                        <Ionicons name="document-text-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.actionBtnPrimaryText}>View Prescription</Text>
                    </TouchableOpacity>
                </BlurView>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <BottomNav activeTab="Medicines" />
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
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Medicine Reminder</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Track and manage your daily meds</Text>
                </View>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={openAddModal}
                >
                    <Ionicons name="add" size={26} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={styles.tabWrapper}
                    onPress={() => { Haptics.selectionAsync(); setActiveTab("My Medicines"); }}
                >
                    <BlurView intensity={activeTab === "My Medicines" ? theme.glassIntensity : 0} tint={theme.glassTint}
                        style={[styles.tabButton, activeTab === "My Medicines" && { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
                        <Text style={[styles.tabText, { color: activeTab === "My Medicines" ? theme.primary : theme.textSecondary, fontWeight: activeTab === "My Medicines" ? "700" : "500" }]}>My Medicines</Text>
                    </BlurView>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tabWrapper}
                    onPress={() => { Haptics.selectionAsync(); setActiveTab("Prescription"); }}
                >
                    <BlurView intensity={activeTab === "Prescription" ? theme.glassIntensity : 0} tint={theme.glassTint}
                        style={[styles.tabButton, activeTab === "Prescription" && { backgroundColor: theme.glassBg, borderColor: theme.glassBorder, borderWidth: 1 }]}>
                        <Text style={[styles.tabText, { color: activeTab === "Prescription" ? theme.primary : theme.textSecondary, fontWeight: activeTab === "Prescription" ? "700" : "500" }]}>Prescription</Text>
                    </BlurView>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {activeTab === "My Medicines" ? renderMyMedicines() : renderPrescriptionMeds()}
                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* Add Medicine Form Modal */}
            {isAddModalOpen && (
                <Animated.View style={[styles.modalOverlay, { opacity: modalFadeAnim }]}>
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeAddModal}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.modalContentWrapper,
                        { transform: [{ translateY: modalSlideAnim }] }
                    ]}>
                        <BlurView intensity={theme.glassIntensity + 20} tint={theme.glassTint} style={[styles.modalGlassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                            <View style={styles.pullBarContainer} {...{ onTouchStart: closeAddModal }}>
                                <View style={[styles.pullBar, { backgroundColor: theme.textSecondary }]} />
                            </View>

                            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 25, paddingBottom: 40 }}>

                                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Add New Medicine</Text>

                                    <View style={styles.inputContainer}>
                                        <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Medicine Name</Text>
                                        <TextInput
                                            style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                            placeholder="e.g. Paracetamol"
                                            placeholderTextColor={theme.textSecondary}
                                            value={formName}
                                            onChangeText={setFormName}
                                        />
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Dosage</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="e.g. 500mg"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formDosage}
                                                onChangeText={setFormDosage}
                                            />
                                        </View>
                                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Frequency</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="e.g. Daily"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formFrequency}
                                                onChangeText={setFormFrequency}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Time</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="08:00 AM"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formTime}
                                                onChangeText={setFormTime}
                                            />
                                        </View>
                                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Notes (Food)</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="e.g. After Food"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formNotes}
                                                onChangeText={setFormNotes}
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.inputRow}>
                                        <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>Start Date</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="DD/MM/YYYY"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formStartDate}
                                                onChangeText={setFormStartDate}
                                            />
                                        </View>
                                        <View style={[styles.inputContainer, { flex: 1, marginLeft: 10 }]}>
                                            <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>End Date</Text>
                                            <TextInput
                                                style={[styles.inputField, { borderColor: theme.glassBorder, backgroundColor: "rgba(0,0,0,0.02)", color: theme.textPrimary }]}
                                                placeholder="DD/MM/YYYY"
                                                placeholderTextColor={theme.textSecondary}
                                                value={formEndDate}
                                                onChangeText={setFormEndDate}
                                            />
                                        </View>
                                    </View>

                                </ScrollView>

                                <View style={[styles.modalBottomActions, { borderTopColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                                    <TouchableOpacity style={[styles.modalBtnDownload, { backgroundColor: theme.primary }]} onPress={handleSaveReminder}>
                                        <Ionicons name="save-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                                        <Text style={styles.modalBtnDownloadText}>Save Reminder</Text>
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
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
    iconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    tabsContainer: {
        flexDirection: "row",
        paddingHorizontal: 20,
        marginBottom: 20,
        gap: 12,
    },
    tabWrapper: {
        flex: 1,
    },
    tabButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    tabText: {
        fontSize: 15,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
        marginTop: 5,
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
        justifyContent: "space-between",
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 10,
    },
    medTime: {
        fontSize: 18,
        fontWeight: "bold",
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },
    divider: {
        height: 1,
        width: "100%",
        marginVertical: 15,
    },
    medContentRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    medName: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    medDosage: {
        fontSize: 14,
        fontWeight: "500",
    },
    instructionsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 15,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    instructionsText: {
        fontSize: 13,
        fontWeight: "600",
        marginLeft: 8,
    },
    actionRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 15,
    },
    actionBtnPrimary: {
        flex: 2,
        flexDirection: "row",
        paddingVertical: 12,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },
    actionBtnPrimaryText: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "600",
    },
    actionBtnOutline: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
        paddingVertical: 12,
    },
    actionBtnOutlineText: {
        fontSize: 14,
        fontWeight: "600",
    },
    doctorInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    prescriberText: {
        fontSize: 14,
        marginLeft: 8,
    },

    /* Modal Form Styles */
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
    modalTitle: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
        marginTop: 10,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: "row",
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 8,
    },
    inputField: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 15,
    },
    modalBottomActions: {
        flexDirection: "row",
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopWidth: 1,
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
