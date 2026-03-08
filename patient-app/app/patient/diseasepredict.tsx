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
    ActivityIndicator,
    Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
// Note: expo-image-picker would typically be imported here for real functionality
// import * as ImagePicker from 'expo-image-picker';

import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

type AppState = "upload" | "preview" | "analyzing" | "result";

export default function DiseasePredictionScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [currentState, setCurrentState] = useState<AppState>("upload");
    const [imageUri, setImageUri] = useState<string | null>(null);

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

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

    // Mock functions for image picking
    const pickImage = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        // Simulate image picking
        setTimeout(() => {
            setImageUri("https://images.unsplash.com/photo-1620392333792-72c676cfa45d?q=80&w=600&auto=format&fit=crop");
            setCurrentState("preview");
        }, 500);
    };

    const removeImage = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setImageUri(null);
        setCurrentState("upload");
    };

    const startAnalysis = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        setCurrentState("analyzing");

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        ).start();

        // Simulate AI processing time
        setTimeout(() => {
            pulseAnim.stopAnimation();
            setCurrentState("result");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 4000);
    };

    const resetFlow = () => {
        setImageUri(null);
        setCurrentState("upload");
    };

    const showInfo = () => {
        Alert.alert(
            "AI Prediction Info",
            "This tool uses artificial intelligence to visually analyze your uploaded image. The results are suggestions only and should NOT replace professional medical diagnosis."
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
        glassBg: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.5)",
        primary: "#0EA5E9",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        uploadBg: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.3)",
    };

    const renderUploadState = () => (
        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
            <TouchableOpacity
                style={[styles.dragDropArea, { backgroundColor: theme.uploadBg, borderColor: theme.primary, borderStyle: 'dashed', borderWidth: 2 }]}
                onPress={pickImage}
                activeOpacity={0.8}
            >
                <View style={[styles.uploadIconCircle, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                    <Ionicons name="cloud-upload-outline" size={40} color={theme.primary} />
                </View>
                <Text style={[styles.uploadTitle, { color: theme.textPrimary }]}>Tap to Upload Image</Text>
                <Text style={[styles.uploadSubtitle, { color: theme.textSecondary }]}>or drag and drop here</Text>
                <Text style={[styles.formatText, { color: theme.textSecondary }]}>Supported formats: JPG, PNG</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtnPrimary, { backgroundColor: theme.primary }]} onPress={pickImage}>
                    <Ionicons name="images-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.actionBtnPrimaryText}>Browse Gallery</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.actionBtnOutline, { borderColor: theme.glassBorder, borderWidth: 1, marginTop: 12 }]} onPress={pickImage}>
                <Ionicons name="camera-outline" size={18} color={theme.textPrimary} style={{ marginRight: 8 }} />
                <Text style={[styles.actionBtnOutlineText, { color: theme.textPrimary }]}>Take Photo</Text>
            </TouchableOpacity>
        </BlurView>
    );

    const renderPreviewState = () => (
        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
            <View style={styles.previewContainer}>
                {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />}
                <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={removeImage}
                >
                    <BlurView intensity={80} tint="dark" style={styles.removeBtnBlur}>
                        <Ionicons name="close" size={20} color="#FFF" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <View style={styles.fileInfoRow}>
                <Ionicons name="image-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={1}>image_upload.jpg</Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>2.4 MB</Text>
            </View>

            <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: theme.primary }]} onPress={startAnalysis}>
                <MaterialCommunityIcons name="brain" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.analyzeBtnText}>Analyze Image</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ position: 'absolute', right: 20 }} />
            </TouchableOpacity>
        </BlurView>
    );

    const renderAnalyzingState = () => (
        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, styles.analyzingCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
            <Animated.View style={[
                styles.pulseCircle,
                { backgroundColor: "rgba(14, 165, 233, 0.1)", transform: [{ scale: pulseAnim }] }
            ]}>
                <MaterialCommunityIcons name="brain" size={60} color={theme.primary} />
            </Animated.View>

            <Text style={[styles.analyzingTitle, { color: theme.textPrimary }]}>Analyzing Image...</Text>
            <Text style={[styles.analyzingSubtitle, { color: theme.textSecondary }]}>Our AI model is cross-referencing your image with medical databases.</Text>

            <View style={styles.loadingBarContainer}>
                <View style={[styles.loadingBar, { backgroundColor: theme.glassBorder }]}>
                    <Animated.View style={[styles.loadingProgress, { backgroundColor: theme.primary }]} />
                </View>
            </View>
        </BlurView>
    );

    const renderResultState = () => (
        <View>
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.glassCard, { borderColor: theme.success, borderWidth: 2, backgroundColor: theme.glassBg }]}>

                <View style={[styles.resultHeader, { backgroundColor: "rgba(16, 185, 129, 0.1)" }]}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.success} />
                    <Text style={[styles.resultHeaderText, { color: theme.success }]}>Analysis Complete</Text>
                </View>

                <View style={styles.predictionRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.predictionLabel, { color: theme.textSecondary }]}>Detected Condition</Text>
                        <Text style={[styles.predictionValue, { color: theme.textPrimary }]}>Mild Contact Dermatitis</Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>92% Match</Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>Description</Text>
                <Text style={[styles.descriptionText, { color: theme.textSecondary }]}>
                    An allergic or irritant skin reaction causing redness and itching. Typically occurs after direct contact with a substance such as plants, cosmetics, or jewelry.
                </Text>

                <Text style={[styles.sectionHeading, { color: theme.textPrimary, marginTop: 15 }]}>Recommendation</Text>
                <View style={[styles.recommendationBox, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                    <Ionicons name="information-circle-outline" size={20} color={theme.primary} style={{ marginTop: 2 }} />
                    <Text style={[styles.recommendationText, { color: theme.textPrimary }]}>Avoid contact with the suspected irritant. Apply a cool compress and consider over-the-counter hydrocortisone cream. If symptoms persist for more than 2 weeks, consult a dermatologist.</Text>
                </View>

            </BlurView>

            <View style={styles.resultActionsContainer}>
                <TouchableOpacity style={[styles.consultBtn, { backgroundColor: theme.primary }]}>
                    <Ionicons name="videocam-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={styles.consultBtnText}>Consult Doctor Now</Text>
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                    <TouchableOpacity style={[styles.secondaryActionBtn, { borderColor: theme.primary, borderWidth: 1 }]} onPress={resetFlow}>
                        <Ionicons name="refresh-outline" size={18} color={theme.primary} />
                        <Text style={[styles.secondaryActionText, { color: theme.primary, marginLeft: 6 }]}>Test Another</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.secondaryActionBtn, { borderColor: theme.primary, borderWidth: 1 }]}>
                        <Ionicons name="download-outline" size={18} color={theme.primary} />
                        <Text style={[styles.secondaryActionText, { color: theme.primary, marginLeft: 6 }]}>Save Result</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

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
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Disease Prediction</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Upload an image for AI insights</Text>
                </View>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}
                    onPress={showInfo}
                >
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

                    {currentState === "upload" && renderUploadState()}
                    {currentState === "preview" && renderPreviewState()}
                    {currentState === "analyzing" && renderAnalyzingState()}
                    {currentState === "result" && renderResultState()}

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
    scrollContent: {
        paddingHorizontal: 20,
    },
    glassCard: {
        borderRadius: 24,
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

    /* Upload State Styles */
    dragDropArea: {
        width: "100%",
        paddingVertical: 40,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    uploadIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    uploadTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
    },
    uploadSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    formatText: {
        fontSize: 12,
        fontWeight: "500",
    },
    actionRow: {
        flexDirection: "row",
    },
    actionBtnPrimary: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
    },
    actionBtnPrimaryText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    actionBtnOutline: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        paddingVertical: 14,
    },
    actionBtnOutlineText: {
        fontSize: 16,
        fontWeight: "600",
    },

    /* Preview State Styles */
    previewContainer: {
        width: "100%",
        height: 300,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
    },
    previewImage: {
        width: "100%",
        height: "100%",
    },
    removeBtn: {
        position: "absolute",
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        overflow: "hidden",
    },
    removeBtnBlur: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    fileInfoRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.03)",
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
    },
    fileName: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        fontWeight: "500",
    },
    fileSize: {
        fontSize: 12,
    },
    analyzeBtn: {
        flexDirection: "row",
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
        position: 'relative',
    },
    analyzeBtnText: {
        color: "#FFF",
        fontSize: 18,
        fontWeight: "bold",
    },

    /* Analyzing State Styles */
    analyzingCard: {
        alignItems: "center",
        paddingVertical: 40,
    },
    pulseCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    analyzingTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },
    analyzingSubtitle: {
        fontSize: 14,
        textAlign: "center",
        paddingHorizontal: 20,
        marginBottom: 30,
        lineHeight: 20,
    },
    loadingBarContainer: {
        width: "100%",
        paddingHorizontal: 20,
    },
    loadingBar: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    loadingProgress: {
        width: "60%", // Static for visual simulation
        height: "100%",
        borderRadius: 4,
    },

    /* Result State Styles */
    resultHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        alignSelf: "flex-start",
    },
    resultHeaderText: {
        fontSize: 14,
        fontWeight: "bold",
        marginLeft: 8,
    },
    predictionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    predictionLabel: {
        fontSize: 13,
        marginBottom: 2,
    },
    predictionValue: {
        fontSize: 20,
        fontWeight: "bold",
    },
    confidenceBadge: {
        backgroundColor: "#10B981",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    confidenceText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold",
    },
    divider: {
        height: 1,
        width: "100%",
        marginVertical: 20,
    },
    sectionHeading: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 22,
    },
    recommendationBox: {
        flexDirection: "row",
        padding: 16,
        borderRadius: 12,
    },
    recommendationText: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "500",
    },
    resultActionsContainer: {
        marginTop: 5,
    },
    consultBtn: {
        flexDirection: "row",
        paddingVertical: 16,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 16,
    },
    consultBtnText: {
        color: "#FFF",
        fontSize: 16,
        fontWeight: "bold",
    },
    secondaryActionBtn: {
        flex: 1,
        flexDirection: "row",
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
    },
    secondaryActionText: {
        fontSize: 15,
        fontWeight: "600",
    },
});
