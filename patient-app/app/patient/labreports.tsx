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
const LAB_REPORTS = [
    {
        id: "lr-001",
        testName: "Complete Blood Count (CBC)",
        labName: "City Diagnostics Lab",
        date: "12/11/2025",
        status: "Completed",
        uploadedBy: "Tech. Rahul Sharma",
        fileName: "CBC_Report_Nov2025.pdf",
        fileSize: "1.2 MB",
        previewImage: "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: "lr-002",
        testName: "Lipid Profile Test",
        labName: "Wellness Clinic Center",
        date: "28/10/2025",
        status: "Completed",
        uploadedBy: "Tech. Anjali Desai",
        fileName: "Lipid_Profile_Oct2025.pdf",
        fileSize: "0.8 MB",
        previewImage: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=400&auto=format&fit=crop"
    },
    {
        id: "lr-003",
        testName: "Thyroid Function Test",
        labName: "Metro Hospital Labs",
        date: "15/11/2025",
        status: "Pending",
        uploadedBy: "",
        fileName: "",
        fileSize: "",
        previewImage: ""
    },
];

export default function LabReportsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [selectedReport, setSelectedReport] = useState<any>(null);
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

    const openDetails = (report: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedReport(report);
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
            setSelectedReport(null);
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
        warning: "#F59E0B"
    };

    // Filter and Sort Logic
    const filteredAndSortedReports = LAB_REPORTS.filter(r => {
        const s = searchQuery.toLowerCase();
        return r.testName.toLowerCase().includes(s) ||
            r.labName.toLowerCase().includes(s);
    }).sort((a, b) => {
        const [dayA, monthA, yearA] = a.date.split("/");
        const [dayB, monthB, yearB] = b.date.split("/");
        const timeA = new Date(Number(yearA), Number(monthA) - 1, Number(dayA)).getTime();
        const timeB = new Date(Number(yearB), Number(monthB) - 1, Number(dayB)).getTime();
        return sortOrder === "newest" ? timeB - timeA : timeA - timeB;
    });

    return (
        <View style={styles.container}>
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
                            placeholder="Search tests, labs..."
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
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Lab Reports</Text>
                        <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>View and download diagnostic reports</Text>
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
                    {filteredAndSortedReports.map((report) => {
                        const isCompleted = report.status === "Completed";
                        return (
                            <BlurView key={report.id} intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                                <View style={styles.cardHeaderRow}>
                                    <View style={[styles.iconBox, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                                        <Ionicons name="flask" size={24} color={theme.primary} />
                                    </View>
                                    <View style={styles.testInfoCol}>
                                        <Text style={[styles.cardTestName, { color: theme.textPrimary }]} numberOfLines={1}>{report.testName}</Text>
                                        <Text style={[styles.cardLabName, { color: theme.textSecondary }]} numberOfLines={1}>{report.labName}</Text>
                                    </View>
                                </View>

                                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                                <View style={styles.cardInfoGrid}>
                                    <View style={styles.infoGroup}>
                                        <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                                        <Text style={[styles.infoText, { color: theme.textPrimary }]}>{report.date}</Text>
                                    </View>
                                    <View style={styles.infoGroup}>
                                        <Ionicons name="ellipse" size={10} color={isCompleted ? theme.success : theme.warning} style={{ marginRight: 4 }} />
                                        <Text style={[styles.infoText, { color: theme.textPrimary }]}>{report.status}</Text>
                                    </View>
                                </View>

                                {isCompleted && report.fileName ? (
                                    <View style={[styles.attachmentBox, { backgroundColor: "rgba(0,0,0,0.03)", borderColor: theme.glassBorder }]}>
                                        <MaterialCommunityIcons name="file-pdf-box" size={32} color="#EF4444" />
                                        <View style={{ flex: 1, marginLeft: 10 }}>
                                            <Text style={[styles.attachmentName, { color: theme.textPrimary }]} numberOfLines={1}>{report.fileName}</Text>
                                            <Text style={[styles.attachmentSize, { color: theme.textSecondary }]}>{report.fileSize}</Text>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={[styles.attachmentBox, { backgroundColor: "rgba(0,0,0,0.02)", borderColor: theme.glassBorder, justifyContent: 'center' }]}>
                                        <Text style={[styles.attachmentSize, { color: theme.textSecondary, fontStyle: 'italic' }]}>Report will be uploaded soon.</Text>
                                    </View>
                                )}

                                <View style={styles.actionRow}>
                                    <TouchableOpacity
                                        style={[styles.actionBtnPrimary, { backgroundColor: isCompleted ? theme.primary : "rgba(14, 165, 233, 0.5)" }]}
                                        onPress={() => isCompleted && openDetails(report)}
                                        disabled={!isCompleted}
                                    >
                                        <Ionicons name="eye-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                                        <Text style={styles.actionBtnPrimaryText}>View Report</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtnOutline, { borderColor: isCompleted ? theme.primary : "rgba(14, 165, 233, 0.2)", borderWidth: 1 }]}
                                        disabled={!isCompleted}
                                    >
                                        <Ionicons name="download-outline" size={18} color={isCompleted ? theme.primary : "rgba(14, 165, 233, 0.5)"} />
                                    </TouchableOpacity>
                                </View>
                            </BlurView>
                        );
                    })}
                    <View style={{ height: 100 }} />
                </Animated.View>
            </ScrollView>

            {/* Details Modal Overlay */}
            {selectedReport && (
                <Animated.View style={[styles.modalOverlay, { opacity: modalFadeAnim }]}>
                    <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={closeDetails}>
                        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    </TouchableOpacity>

                    <Animated.View style={[
                        styles.modalContentWrapper,
                        { transform: [{ translateY: modalSlideAnim }] }
                    ]}>
                        <BlurView intensity={theme.glassIntensity + 20} tint={theme.glassTint} style={[styles.modalGlassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                            <View style={styles.pullBarContainer} {...{ onTouchStart: closeDetails }}>
                                <View style={[styles.pullBar, { backgroundColor: theme.textSecondary }]} />
                            </View>

                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTestName, { color: theme.textPrimary }]}>{selectedReport.testName}</Text>
                                    <Text style={[styles.modalLabName, { color: theme.primary }]}>{selectedReport.labName}</Text>
                                </View>

                                <View style={[styles.divider, { backgroundColor: theme.glassBorder, marginVertical: 20 }]} />

                                <View style={styles.modalSection}>
                                    <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>Report Details</Text>

                                    <View style={[styles.detailRow, { borderBottomColor: theme.glassBorder }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Test Date</Text>
                                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedReport.date}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomColor: theme.glassBorder }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Status</Text>
                                        <Text style={[styles.detailValue, { color: theme.success }]}>{selectedReport.status}</Text>
                                    </View>
                                    <View style={[styles.detailRow, { borderBottomColor: "transparent" }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Uploaded By</Text>
                                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedReport.uploadedBy}</Text>
                                    </View>
                                </View>

                                <View style={styles.modalSection}>
                                    <Text style={[styles.modalSectionTitle, { color: theme.textPrimary }]}>Attachment Preview</Text>

                                    <View style={[styles.previewContainer, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                                        <Image source={{ uri: selectedReport.previewImage }} style={styles.previewImage} resizeMode="cover" />

                                        <LinearGradient
                                            colors={['transparent', 'rgba(0,0,0,0.8)']}
                                            style={styles.previewOverlay}
                                        >
                                            <View style={styles.previewFileInfo}>
                                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#FFF" />
                                                <View style={{ flex: 1, marginLeft: 10 }}>
                                                    <Text style={styles.previewFileName} numberOfLines={1}>{selectedReport.fileName}</Text>
                                                    <Text style={styles.previewFileSize}>{selectedReport.fileSize} • Uploaded {selectedReport.date}</Text>
                                                </View>
                                            </View>
                                        </LinearGradient>
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
                                    <Text style={styles.modalBtnDownloadText}>Download Report</Text>
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
        padding: 24,
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
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    testInfoCol: {
        flex: 1,
        marginLeft: 15,
    },
    cardTestName: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    cardLabName: {
        fontSize: 14,
        fontWeight: "500",
    },
    divider: {
        height: 1,
        width: "100%",
        marginVertical: 18,
    },
    cardInfoGrid: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    infoGroup: {
        flexDirection: "row",
        alignItems: "center",
    },
    infoText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 6,
    },
    attachmentBox: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
    },
    attachmentName: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 2,
    },
    attachmentSize: {
        fontSize: 12,
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
        fontSize: 15,
        fontWeight: "600",
    },
    actionBtnOutline: {
        width: 50,
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
    modalHeader: {
        paddingHorizontal: 25,
        marginTop: 10,
    },
    modalTestName: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 6,
    },
    modalLabName: {
        fontSize: 16,
        fontWeight: "600",
    },
    modalSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
    },
    modalSectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    detailLabel: {
        fontSize: 15,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: "600",
    },
    previewContainer: {
        width: "100%",
        height: 250,
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    previewOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingTop: 40,
    },
    previewFileInfo: {
        flexDirection: "row",
        alignItems: "center",
    },
    previewFileName: {
        color: "#FFF",
        fontSize: 15,
        fontWeight: "bold",
        marginBottom: 4,
    },
    previewFileSize: {
        color: "rgba(255,255,255,0.8)",
        fontSize: 12,
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
