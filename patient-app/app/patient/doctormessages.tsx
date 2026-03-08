import React, { useState, useRef, useEffect } from "react";
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
    Keyboard,
    Image,
    Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

// --- TYPES ---
type ViewState = "categories" | "list" | "chat";

type Message = {
    id: string;
    text: string;
    sender: "patient" | "doctor";
    time: string;
    type?: "text" | "image" | "audio" | "file";
    attachmentName?: string;
};

type Doctor = {
    id: string;
    name: string;
    specialty: string;
    experience: string;
    isOnline: boolean;
    image: string;
};

// --- MOCK DATA ---
const CATEGORIES = [
    { id: "c1", name: "Cardiology", icon: "heart-outline", color: "#EF4444" },
    { id: "c2", name: "Neurology", icon: "git-network-outline", color: "#8B5CF6" },
    { id: "c3", name: "Orthopedic", icon: "fitness-outline", color: "#F59E0B" },
    { id: "c4", name: "Dermatology", icon: "body-outline", color: "#EC4899" },
    { id: "c5", name: "General Physician", icon: "medical-outline", color: "#10B981" },
];

const DOCTORS: Doctor[] = [
    { id: "d1", name: "Dr. Sarah Jenkins", specialty: "Cardiology", experience: "12 Years exp.", isOnline: true, image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop" },
    { id: "d2", name: "Dr. Michael Chen", specialty: "Cardiology", experience: "8 Years exp.", isOnline: false, image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop" },
    { id: "d3", name: "Dr. Emily Stone", specialty: "Dermatology", experience: "5 Years exp.", isOnline: true, image: "https://images.unsplash.com/photo-1594824436998-058a231ab4fc?q=80&w=200&auto=format&fit=crop" },
];

const INITIAL_MESSAGES: Message[] = [
    { id: "m1", text: "Hello! Thank you for consulting me. How can I help?", sender: "doctor", time: "10:00 AM" },
    { id: "m2", text: "Hi Dr. Sarah, I've been experiencing mild chest palpitations lately.", sender: "patient", time: "10:02 AM" },
    { id: "m3", text: "I see. Have you noticed if this happens more during exercise or while resting?", sender: "doctor", time: "10:05 AM" },
];

// --- COMPONENT START ---
export default function DoctorMessagesScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [viewState, setViewState] = useState<ViewState>("categories");
    const [selectedCategory, setSelectedCategory] = useState<{ name: string } | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

    // Chat State
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string, type: "image" | "audio" | "file" } | null>(null);

    const scrollViewRef = useRef<ScrollView>(null);

    // Animations
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const attachMenuHeight = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

    // --- NAVIGATION ---
    const goToCategories = () => {
        Haptics.selectionAsync();
        setViewState("categories");
        setSelectedCategory(null);
        setSelectedDoctor(null);
    };

    const goToList = (categoryName: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory({ name: categoryName });
        setViewState("list");
    };

    const goToChat = (doctor: Doctor) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedDoctor(doctor);
        setViewState("chat");
        setMessages(INITIAL_MESSAGES); // Resets mock chat for demo
    };

    const goBack = () => {
        if (viewState === "chat") setViewState("list");
        else if (viewState === "list") goToCategories();
    };

    // --- CHAT FUNCTIONS ---
    const toggleAttachmentMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isAttachmentMenuOpen) {
            Animated.timing(attachMenuHeight, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setIsAttachmentMenuOpen(false));
        } else {
            setIsAttachmentMenuOpen(true);
            Animated.spring(attachMenuHeight, { toValue: 100, tension: 50, friction: 8, useNativeDriver: false }).start();
            Keyboard.dismiss();
        }
    };

    const attachMockFile = (type: "image" | "audio" | "file") => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        let name = "Document.pdf";
        if (type === "image") name = "IMG_4920.jpg";
        if (type === "audio") name = "Voice_Note_01.m4a";
        setAttachedFile({ name, type });
        toggleAttachmentMenu();
    };

    const removeAttachment = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAttachedFile(null);
    };

    const sendMessage = () => {
        if (!inputText.trim() && !attachedFile) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: "patient",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...(attachedFile && { type: attachedFile.type, attachmentName: attachedFile.name })
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText("");
        setAttachedFile(null);
        setIsAttachmentMenuOpen(false);

        // Auto-reply mock
        setTimeout(() => {
            const docReply: Message = {
                id: (Date.now() + 1).toString(),
                text: attachedFile ? "Thanks for sending that over. Let me review it." : "I've noted that down. Can you provide more details?",
                sender: "doctor",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, docReply]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 1500);
    };

    // --- THEME ---
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
        offline: "#94A3B8",
        patientBubble: isDark ? "rgba(14, 165, 233, 0.25)" : "rgba(14, 165, 233, 0.15)",
        patientBubbleBorder: isDark ? "rgba(14, 165, 233, 0.4)" : "rgba(14, 165, 233, 0.3)",
        docBubble: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
    };

    // --- RENDERERS ---
    const renderHeader = () => {
        if (viewState === "chat" && selectedDoctor) {
            return (
                <BlurView intensity={theme.glassIntensity + 40} tint={theme.glassTint} style={[styles.headerChat, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg, paddingTop: Platform.OS === 'ios' ? 50 : 35 }]}>
                    <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                        <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Image source={{ uri: selectedDoctor.image }} style={styles.headerDocImage} />
                    <View style={styles.headerChatInfo}>
                        <Text style={[styles.headerChatName, { color: theme.textPrimary }]} numberOfLines={1}>{selectedDoctor.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, { backgroundColor: selectedDoctor.isOnline ? theme.success : theme.offline }]} />
                            <Text style={[styles.statusText, { color: theme.textSecondary }]}>{selectedDoctor.isOnline ? "Online" : "Offline"}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => Linking.openURL('tel:1234567890')}>
                        <Ionicons name="call-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                </BlurView>
            );
        }

        return (
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.headerSection, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg, paddingTop: Platform.OS === 'ios' ? 50 : 35 }]}>
                {viewState === "list" && (
                    <TouchableOpacity style={[styles.backBtn, { marginRight: 10 }]} onPress={goBack}>
                        <Ionicons name="chevron-back" size={28} color={theme.textPrimary} />
                    </TouchableOpacity>
                )}
                <View style={{ flex: 1 }}>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Consult Doctor</Text>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>{viewState === "categories" ? "Select a specialty to begin" : `Doctors in ${selectedCategory?.name}`}</Text>
                </View>
            </BlurView>
        );
    };

    const renderCategories = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.gridContainer}>
                {CATEGORIES.map((cat) => (
                    <TouchableOpacity key={cat.id} style={styles.gridItem} activeOpacity={0.7} onPress={() => goToList(cat.name)}>
                        <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.catCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                            <View style={[styles.catIconBox, { backgroundColor: `${cat.color}15` }]}>
                                <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                            </View>
                            <Text style={[styles.catName, { color: theme.textPrimary }]}>{cat.name}</Text>
                        </BlurView>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );

    const renderDoctorList = () => {
        // Filter mock docs just to show some visual change, in real app filter by cat.name
        const filteredDocs = DOCTORS.filter(d => selectedCategory?.name === "Cardiology" ? d.specialty === "Cardiology" : true);

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {filteredDocs.map((doc) => (
                    <BlurView key={doc.id} intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.docListCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.docRowMain}>
                            <Image source={{ uri: doc.image }} style={styles.docListImage} />
                            <View style={styles.docListInfo}>
                                <Text style={[styles.docListName, { color: theme.textPrimary }]} numberOfLines={1}>{doc.name}</Text>
                                <Text style={[styles.docListSpec, { color: theme.primary }]}>{doc.specialty} • <Text style={{ color: theme.textSecondary }}>{doc.experience}</Text></Text>

                                <View style={[styles.statusRow, { marginTop: 4 }]}>
                                    <View style={[styles.statusDot, { backgroundColor: doc.isOnline ? theme.success : theme.offline }]} />
                                    <Text style={[styles.statusText, { color: theme.textSecondary }]}>{doc.isOnline ? "Online Now" : "Currently Offline"}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.divider, { backgroundColor: theme.glassBorder }]} />

                        <TouchableOpacity style={[styles.chatNowBtn, { backgroundColor: theme.primary }]} onPress={() => goToChat(doc)}>
                            <Ionicons name="chatbubbles-outline" size={18} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.chatNowBtnText}>Chat Now</Text>
                        </TouchableOpacity>
                    </BlurView>
                ))}
            </ScrollView>
        );
    };

    const renderChatMessages = () => (
        <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
            {messages.map((msg) => {
                const isPatient = msg.sender === "patient";

                return (
                    <View key={msg.id} style={[styles.messageWrapper, isPatient ? styles.messageWrapperPatient : styles.messageWrapperDoc]}>
                        <BlurView
                            intensity={theme.glassIntensity + 10}
                            tint={theme.glassTint}
                            style={[
                                styles.messageBubble,
                                isPatient ? styles.patientBubble : styles.docBubble,
                                {
                                    backgroundColor: isPatient ? theme.patientBubble : theme.docBubble,
                                    borderColor: isPatient ? theme.patientBubbleBorder : theme.glassBorder,
                                }
                            ]}
                        >
                            {/* Attachment Rendering */}
                            {msg.type && msg.attachmentName && (
                                <View style={[styles.chatAttachment, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.4)', borderColor: theme.glassBorder }]}>
                                    <View style={[styles.chatAttachIconBox, { backgroundColor: msg.type === 'image' ? '#10B98120' : msg.type === 'audio' ? '#F59E0B20' : '#8B5CF620' }]}>
                                        <Ionicons
                                            name={msg.type === 'image' ? "image-outline" : msg.type === 'audio' ? "mic-outline" : "document-text-outline"}
                                            size={20}
                                            color={msg.type === 'image' ? "#10B981" : msg.type === 'audio' ? "#F59E0B" : "#8B5CF6"}
                                        />
                                    </View>
                                    <Text style={[styles.chatAttachName, { color: theme.textPrimary }]} numberOfLines={1}>{msg.attachmentName}</Text>
                                </View>
                            )}

                            {msg.text ? <Text style={[styles.messageText, { color: theme.textPrimary }]}>{msg.text}</Text> : null}

                            <Text style={[styles.messageTime, { color: theme.textSecondary, alignSelf: isPatient ? 'flex-end' : 'flex-start' }]}>{msg.time}</Text>
                        </BlurView>
                    </View>
                );
            })}
        </ScrollView>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
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

            {renderHeader()}

            {viewState === "categories" && renderCategories()}
            {viewState === "list" && renderDoctorList()}
            {viewState === "chat" && renderChatMessages()}

            {/* Chat Input Bar */}
            {viewState === "chat" && (
                <BlurView intensity={theme.glassIntensity + 30} tint={theme.glassTint} style={[styles.inputContainer, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                    {/* Attachment Preview Card */}
                    {attachedFile && (
                        <View style={[styles.attachmentPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.glassBorder }]}>
                            <Ionicons name={attachedFile.type === 'image' ? "image-outline" : attachedFile.type === 'audio' ? "mic-outline" : "document-text-outline"} size={20} color={theme.primary} />
                            <Text style={[styles.attachmentPreviewText, { color: theme.textPrimary }]} numberOfLines={1}>{attachedFile.name}</Text>
                            <TouchableOpacity onPress={removeAttachment}>
                                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.inputRow}>
                        <TouchableOpacity style={styles.attachBtn} onPress={toggleAttachmentMenu}>
                            <Ionicons name={isAttachmentMenuOpen ? "close" : "add-circle-outline"} size={28} color={theme.textSecondary} />
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.textInput, { color: theme.textPrimary, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}
                            placeholder="Type a message..."
                            placeholderTextColor={theme.textSecondary}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                        />

                        {inputText.trim() || attachedFile ? (
                            <TouchableOpacity style={[styles.sendBtn, { backgroundColor: theme.primary }]} onPress={sendMessage}>
                                <Ionicons name="send" size={16} color="#FFF" style={{ marginLeft: 3 }} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.voiceBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
                                <Ionicons name="mic-outline" size={26} color={theme.primary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Expandable Attachment Menu */}
                    <Animated.View style={[styles.attachmentMenu, { height: attachMenuHeight, opacity: attachMenuHeight.interpolate({ inputRange: [0, 100], outputRange: [0, 1] }) }]}>
                        <View style={styles.attachMenuContent}>
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('image')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                                    <Ionicons name="image-outline" size={24} color="#10B981" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>Gallery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('file')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(14, 165, 233, 0.15)" }]}>
                                    <Ionicons name="document-attach-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>File</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('audio')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                                    <Ionicons name="mic-outline" size={24} color="#F59E0B" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>Audio</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </BlurView>
            )}

            {/* Bottom Nav replacing input bar on list/category views */}
            {viewState !== "chat" && <BottomNav activeTab="Dashboard" />}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    ambientBackground: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
    orb: { position: "absolute", borderRadius: 999, filter: "blur(50px)" },
    orb1: { width: width * 0.9, height: width * 0.9, backgroundColor: "rgba(14, 165, 233, 0.15)", top: -width * 0.1, left: -width * 0.2 },
    orb2: { width: width * 1.1, height: width * 1.1, backgroundColor: "rgba(45, 212, 191, 0.12)", bottom: height * 0.1, right: -width * 0.3 },

    // --- Header ---
    headerSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, zIndex: 10 },
    headerTitle: { fontSize: 24, fontWeight: "bold", letterSpacing: -0.5 },
    headerSubtitle: { fontSize: 13, marginTop: 2 },

    headerChat: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingBottom: 15, borderBottomWidth: 1, zIndex: 10 },
    backBtn: { padding: 4 },
    headerDocImage: { width: 44, height: 44, borderRadius: 22, marginHorizontal: 10 },
    headerChatInfo: { flex: 1, justifyContent: "center" },
    headerChatName: { fontSize: 18, fontWeight: "bold" },
    iconBtn: { padding: 8, backgroundColor: "rgba(14, 165, 233, 0.1)", borderRadius: 20 },

    statusRow: { flexDirection: "row", alignItems: "center" },
    statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
    statusText: { fontSize: 12, fontWeight: "500" },

    scrollContent: { padding: 20, paddingBottom: 100 },

    // --- Categories ---
    gridContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    gridItem: { width: "48%", marginBottom: 16 },
    catCard: { borderRadius: 24, borderWidth: 1, padding: 20, alignItems: "center", justifyContent: "center", height: 160 },
    catIconBox: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 16 },
    catName: { fontSize: 15, fontWeight: "bold", textAlign: "center" },

    // --- Doctor List ---
    docListCard: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 16, overflow: "hidden" },
    docRowMain: { flexDirection: "row", alignItems: "center" },
    docListImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
    docListInfo: { flex: 1 },
    docListName: { fontSize: 18, fontWeight: "bold", marginBottom: 4 },
    docListSpec: { fontSize: 13, fontWeight: "600" },
    divider: { height: 1, width: "100%", marginVertical: 15 },
    chatNowBtn: { flexDirection: "row", paddingVertical: 12, alignItems: "center", justifyContent: "center", borderRadius: 12 },
    chatNowBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },

    // --- Chat Room ---
    chatScrollContent: { padding: 20, paddingBottom: 40 },
    messageWrapper: { flexDirection: "row", marginBottom: 16, maxWidth: "85%" },
    messageWrapperPatient: { alignSelf: "flex-end" },
    messageWrapperDoc: { alignSelf: "flex-start" },
    messageBubble: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    patientBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 20, borderBottomRightRadius: 4 },
    docBubble: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 4 },
    messageText: { fontSize: 15, lineHeight: 22 },
    messageTime: { fontSize: 10, marginTop: 6 },

    chatAttachment: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    chatAttachIconBox: { padding: 8, borderRadius: 8, marginRight: 10 },
    chatAttachName: { fontSize: 14, fontWeight: "500", flexShrink: 1 },

    // --- Input Area ---
    inputContainer: { borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 30 : 16, overflow: "hidden" },
    attachmentPreview: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, marginBottom: 10, alignSelf: 'flex-start' },
    attachmentPreviewText: { fontSize: 14, marginHorizontal: 8, maxWidth: 200 },
    inputRow: { flexDirection: "row", alignItems: "flex-end" },
    attachBtn: { padding: 8, marginRight: 4, marginBottom: 2 },
    textInput: { flex: 1, minHeight: 46, maxHeight: 120, borderRadius: 24, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, fontSize: 15, marginRight: 10 },
    sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginBottom: 2 },
    voiceBtn: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", marginBottom: 2 },

    attachmentMenu: { overflow: "hidden" },
    attachMenuContent: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 10, paddingTop: 16, paddingBottom: 8 },
    attachOption: { alignItems: "center", gap: 8 },
    attachIconCircle: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
    attachOptionText: { fontSize: 13, fontWeight: "500" },
});
