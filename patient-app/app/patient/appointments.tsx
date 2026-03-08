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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

const SPECIALTIES = [
    { id: "1", name: "Cardiology", icon: "heartbeat" },
    { id: "2", name: "Dermatology", icon: "allergies" },
    { id: "3", name: "General Medicine", icon: "stethoscope" },
    { id: "4", name: "Neurology", icon: "brain" },
    { id: "5", name: "Orthopedics", icon: "bone" },
];

const DOCTORS = [
    { id: "d1", name: "Dr. Sarah Jenkins", specialty: "Cardiology", experience: "12 Years", rating: 4.8, image: "https://i.pravatar.cc/150?img=35" },
    { id: "d2", name: "Dr. Michael Chen", specialty: "Neurology", experience: "8 Years", rating: 4.9, image: "https://i.pravatar.cc/150?img=14" },
    { id: "d3", name: "Dr. Emily Stone", specialty: "General Medicine", experience: "15 Years", rating: 4.7, image: "https://i.pravatar.cc/150?img=43" },
];

const TIME_SLOTS = ["09:00 AM", "09:30 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:30 PM", "04:00 PM"];

export default function AppointmentsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [activeTab, setActiveTab] = useState("Upcoming"); // Upcoming, Past, Book
    const [bookingStep, setBookingStep] = useState(1); // 1: Specialty, 2: Doctor, 3: Date, 4: Time, 5: Confirm

    // Booking State
    const [selectedSpecialty, setSelectedSpecialty] = useState<any>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<any>(null);
    const [selectedTime, setSelectedTime] = useState<any>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

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
    }, [activeTab, bookingStep]);

    const switchTab = (tab: string) => {
        Haptics.selectionAsync();
        fadeAnim.setValue(0);
        slideAnim.setValue(30);
        setActiveTab(tab);
        if (tab === "Book") {
            setBookingStep(1);
            setSelectedSpecialty(null);
            setSelectedDoctor(null);
            setSelectedDate(null);
            setSelectedTime(null);
        }
    };

    const nextBookingStep = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        setBookingStep((prev) => prev + 1);
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
        primary: "#0EA5E9",
        success: "#10B981",
        danger: "#EF4444",
    };

    // --- Render Functions ---

    const renderUpcoming = () => (
        <View style={styles.tabContent}>
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                <View style={styles.cardHeaderRow}>
                    <Image source={{ uri: DOCTORS[0].image }} style={styles.doctorAvatarClipped} />
                    <View style={styles.doctorInfoCol}>
                        <Text style={[styles.cardDoctorName, { color: theme.textPrimary }]}>{DOCTORS[0].name}</Text>
                        <Text style={[styles.cardDoctorSpec, { color: theme.primary }]}>{DOCTORS[0].specialty}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "rgba(16, 185, 129, 0.3)" }]}>
                        <Text style={[styles.statusText, { color: theme.success }]}>Confirmed</Text>
                    </View>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />
                <View style={styles.appointmentDetailsRow}>
                    <View style={styles.detailItem}>
                        <Ionicons name="calendar-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textPrimary }]}>Mon, 12 Nov</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time-outline" size={18} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textPrimary }]}>10:00 AM</Text>
                    </View>
                </View>
                <View style={[styles.detailItem, { marginTop: 10 }]}>
                    <Ionicons name="business-outline" size={18} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textPrimary }]}>City General Hospital - Wing B</Text>
                </View>

                <View style={styles.actionRow}>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(0,0,0,0.05)" }]}>
                        <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                        <Text style={[styles.actionBtnText, { color: theme.danger }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </BlurView>
        </View>
    );

    const renderPast = () => (
        <View style={styles.tabContent}>
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                <View style={styles.cardHeaderRow}>
                    <Image source={{ uri: DOCTORS[2].image }} style={styles.doctorAvatarClipped} />
                    <View style={styles.doctorInfoCol}>
                        <Text style={[styles.cardDoctorName, { color: theme.textPrimary }]}>{DOCTORS[2].name}</Text>
                        <Text style={[styles.cardDoctorSpec, { color: theme.primary }]}>{DOCTORS[2].specialty}</Text>
                    </View>
                    <Text style={[styles.dateSmallText, { color: theme.textSecondary }]}>05 Oct 2025</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <View style={styles.summaryBox}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Diagnosis Summary:</Text>
                    <Text style={[styles.summaryText, { color: theme.textPrimary }]}>Mild throat infection. Prescribed antibiotics for 5 days. Suggested warm water gargle.</Text>
                </View>

                <TouchableOpacity style={[styles.fullWidthBtn, { borderColor: theme.primary, borderWidth: 1 }]}>
                    <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                    <Text style={[styles.fullWidthBtnText, { color: theme.primary }]}>View Prescription</Text>
                </TouchableOpacity>
            </BlurView>
        </View>
    );

    const renderBookNew = () => {
        return (
            <View style={styles.tabContent}>
                {/* Step Indicator */}
                <View style={styles.stepIndicatorContainer}>
                    {[1, 2, 3, 4, 5].map((step) => (
                        <View key={step} style={styles.stepDotWrapper}>
                            <View style={[
                                styles.stepDot,
                                { backgroundColor: step <= bookingStep ? theme.primary : theme.glassBorder },
                                step === bookingStep && styles.stepDotActive
                            ]} />
                        </View>
                    ))}
                </View>

                {bookingStep === 1 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Select Specialty</Text>
                        {SPECIALTIES.map(spec => (
                            <TouchableOpacity key={spec.id} onPress={() => { setSelectedSpecialty(spec); nextBookingStep(); }}>
                                <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.selectionCard, { borderColor: selectedSpecialty?.id === spec.id ? theme.primary : theme.glassBorder, backgroundColor: theme.glassBg }]}>
                                    <View style={[styles.iconBox, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                                        <FontAwesome5 name={spec.icon} size={20} color={theme.primary} />
                                    </View>
                                    <Text style={[styles.selectionCardText, { color: theme.textPrimary }]}>{spec.name}</Text>
                                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {bookingStep === 2 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Choose a Doctor</Text>
                        {DOCTORS.map(doc => (
                            <TouchableOpacity key={doc.id} onPress={() => { setSelectedDoctor(doc); nextBookingStep(); }}>
                                <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.doctorCard, { borderColor: selectedDoctor?.id === doc.id ? theme.primary : theme.glassBorder, backgroundColor: theme.glassBg }]}>
                                    <Image source={{ uri: doc.image }} style={styles.doctorAvatarLarge} />
                                    <View style={styles.docCardInfo}>
                                        <Text style={[styles.docCardName, { color: theme.textPrimary }]}>{doc.name}</Text>
                                        <Text style={[styles.docCardSpec, { color: theme.textSecondary }]}>{doc.specialty}</Text>
                                        <View style={styles.docStatsRow}>
                                            <Ionicons name="star" size={14} color="#F59E0B" />
                                            <Text style={[styles.docStatText, { color: theme.textPrimary }]}>{doc.rating}</Text>
                                            <Text style={[styles.docStatText, { color: theme.textSecondary }]}> • {doc.experience}</Text>
                                        </View>
                                    </View>
                                </BlurView>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {bookingStep === 3 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Select Date</Text>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.calendarContainer, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            {/* Very Basic Mock Calendar since installing a calendar module wasn't specified */}
                            <View style={styles.calendarHeader}>
                                <Ionicons name="chevron-back" size={20} color={theme.textPrimary} />
                                <Text style={[styles.calendarMonth, { color: theme.textPrimary }]}>November 2025</Text>
                                <Ionicons name="chevron-forward" size={20} color={theme.textPrimary} />
                            </View>
                            <View style={styles.daysRow}>
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <Text key={i} style={[styles.dayHeader, { color: theme.textSecondary }]}>{d}</Text>)}
                            </View>
                            <View style={styles.datesGrid}>
                                {Array.from({ length: 30 }).map((_, i) => {
                                    const day = i + 1;
                                    const isSelected = selectedDate === day;
                                    return (
                                        <TouchableOpacity
                                            key={day}
                                            style={[styles.dateCell, isSelected && { backgroundColor: theme.primary }]}
                                            onPress={() => setSelectedDate(day)}
                                        >
                                            <Text style={[styles.dateText, { color: isSelected ? "#FFF" : theme.textPrimary }]}>{day}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </BlurView>
                        {selectedDate && (
                            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: theme.primary }]} onPress={nextBookingStep}>
                                <Text style={styles.continueBtnText}>Continue</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {bookingStep === 4 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Select Time Slot</Text>
                        <View style={styles.timeSlotsGrid}>
                            {TIME_SLOTS.map(time => (
                                <TouchableOpacity
                                    key={time}
                                    onPress={() => setSelectedTime(time)}
                                    style={{ width: '48%', marginBottom: 12 }}
                                >
                                    <BlurView
                                        intensity={theme.glassIntensity}
                                        tint={theme.glassTint}
                                        style={[
                                            styles.timeSlotCard,
                                            {
                                                borderColor: selectedTime === time ? theme.primary : theme.glassBorder,
                                                backgroundColor: selectedTime === time ? theme.primary : theme.glassBg
                                            }
                                        ]}
                                    >
                                        <Text style={[
                                            styles.timeSlotText,
                                            { color: selectedTime === time ? "#FFF" : theme.textPrimary }
                                        ]}>{time}</Text>
                                    </BlurView>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {selectedTime && (
                            <TouchableOpacity style={[styles.continueBtn, { backgroundColor: theme.primary }]} onPress={nextBookingStep}>
                                <Text style={styles.continueBtnText}>Review Appointment</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {bookingStep === 5 && (
                    <View>
                        <Text style={[styles.stepTitle, { color: theme.textPrimary }]}>Confirm Appointment</Text>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <View style={styles.confirmHeader}>
                                <Image source={{ uri: selectedDoctor?.image }} style={styles.doctorAvatarLarge} />
                                <Text style={[styles.confirmDocName, { color: theme.textPrimary }]}>{selectedDoctor?.name}</Text>
                                <Text style={[styles.confirmDocSpec, { color: theme.textSecondary }]}>{selectedDoctor?.specialty}</Text>
                            </View>
                            <View style={[styles.divider, { backgroundColor: theme.glassBorder, marginVertical: 20 }]} />
                            <View style={styles.confirmDetailsGrid}>
                                <View style={styles.confirmDetailBox}>
                                    <Ionicons name="calendar" size={24} color={theme.primary} />
                                    <Text style={[styles.confirmDetailSub, { color: theme.textSecondary }]}>Date</Text>
                                    <Text style={[styles.confirmDetailVal, { color: theme.textPrimary }]}>Nov {selectedDate}, 2025</Text>
                                </View>
                                <View style={styles.confirmDetailBox}>
                                    <Ionicons name="time" size={24} color={theme.primary} />
                                    <Text style={[styles.confirmDetailSub, { color: theme.textSecondary }]}>Time</Text>
                                    <Text style={[styles.confirmDetailVal, { color: theme.textPrimary }]}>{selectedTime}</Text>
                                </View>
                            </View>
                        </BlurView>
                        <TouchableOpacity style={[styles.continueBtn, { backgroundColor: theme.success }]} onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            switchTab("Upcoming");
                        }}>
                            <Text style={styles.continueBtnText}>Confirm Booking</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <BottomNav activeTab="APPT" />
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
                <View>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Appointments</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Manage and book doctor visits</Text>
                </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsWrapper}>
                <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.tabsContainer, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}>
                    {["Upcoming", "Past", "Book"].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tabButton, isActive && { backgroundColor: theme.primary }]}
                                onPress={() => switchTab(tab)}
                            >
                                <Text style={[styles.tabText, { color: isActive ? "#FFF" : theme.textPrimary, fontWeight: isActive ? "bold" : "500" }]}>
                                    {tab === "Book" ? "Book New" : tab}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </BlurView>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    {activeTab === "Upcoming" && renderUpcoming()}
                    {activeTab === "Past" && renderPast()}
                    {activeTab === "Book" && renderBookNew()}
                </Animated.View>
                <View style={{ height: 100 }} />
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
    notifDot: {
        position: "absolute",
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#EF4444",
    },
    tabsWrapper: {
        paddingHorizontal: 20,
        marginBottom: 20,
        zIndex: 10,
    },
    tabsContainer: {
        flexDirection: "row",
        borderRadius: 100,
        borderWidth: 1,
        padding: 4,
        overflow: "hidden",
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 100,
    },
    tabText: {
        fontSize: 14,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    tabContent: {
        flex: 1,
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
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
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
    appointmentDetailsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    detailText: {
        fontSize: 14,
        fontWeight: "500",
        marginLeft: 8,
    },
    actionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: "center",
        borderRadius: 12,
    },
    actionBtnText: {
        fontSize: 14,
        fontWeight: "600",
    },
    dateSmallText: {
        fontSize: 12,
        fontWeight: "500",
    },
    summaryBox: {
        backgroundColor: "rgba(0,0,0,0.02)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 16,
    },
    summaryLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 20,
    },
    fullWidthBtn: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 12,
    },
    fullWidthBtnText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
    },
    stepIndicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 24,
        gap: 8,
    },
    stepDotWrapper: {
        padding: 2,
    },
    stepDot: {
        width: 24,
        height: 4,
        borderRadius: 2,
    },
    stepDotActive: {
        height: 6,
    },
    stepTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    selectionCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: "hidden",
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    selectionCardText: {
        flex: 1,
        fontSize: 16,
        fontWeight: "600",
    },
    doctorCard: {
        flexDirection: "row",
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        overflow: "hidden",
    },
    doctorAvatarLarge: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#E2E8F0",
    },
    docCardInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: "center",
    },
    docCardName: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 4,
    },
    docCardSpec: {
        fontSize: 14,
        marginBottom: 8,
    },
    docStatsRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    docStatText: {
        fontSize: 12,
        fontWeight: "500",
        marginLeft: 4,
    },
    calendarContainer: {
        borderRadius: 20,
        borderWidth: 1,
        padding: 20,
        overflow: "hidden",
        marginBottom: 20,
    },
    calendarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    calendarMonth: {
        fontSize: 16,
        fontWeight: "700",
    },
    daysRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    dayHeader: {
        width: 30,
        textAlign: "center",
        fontSize: 12,
        fontWeight: "600",
    },
    datesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "flex-start",
    },
    dateCell: {
        width: "14.28%", // 100/7
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 20,
        marginBottom: 5,
    },
    dateText: {
        fontSize: 15,
        fontWeight: "500",
    },
    continueBtn: {
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#0ea5e9",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 10,
    },
    continueBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    timeSlotsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    timeSlotCard: {
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: "center",
        overflow: "hidden",
    },
    timeSlotText: {
        fontSize: 14,
        fontWeight: "600",
    },
    confirmHeader: {
        alignItems: "center",
        marginTop: 10,
    },
    confirmDocName: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 12,
        marginBottom: 4,
    },
    confirmDocSpec: {
        fontSize: 14,
    },
    confirmDetailsGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    confirmDetailBox: {
        flex: 1,
        alignItems: "center",
    },
    confirmDetailSub: {
        fontSize: 12,
        marginTop: 8,
        marginBottom: 2,
    },
    confirmDetailVal: {
        fontSize: 15,
        fontWeight: "700",
    },
});
