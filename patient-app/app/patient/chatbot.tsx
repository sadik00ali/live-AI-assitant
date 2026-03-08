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
    Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import BottomNav from "../components/BottomNav";

const { width, height } = Dimensions.get("window");

type Message = {
    id: string;
    text: string;
    sender: "user" | "bot";
    time: string;
    isTyping?: boolean;
};

type HistoryItem = {
    id: string;
    topic: string;
    date: string;
    preview: string;
};

// Mock Data
const INITIAL_MESSAGES: Message[] = [
    {
        id: "msg-1",
        text: "Hello! I'm your AI Health Assistant. How can I help you today?",
        sender: "bot",
        time: "10:00 AM",
    },
    {
        id: "msg-2",
        text: "I've been having a mild headache since morning and my eyes feel tired.",
        sender: "user",
        time: "10:05 AM",
    },
    {
        id: "msg-3",
        text: "I understand. Eye strain can often cause mild headaches, especially if you've been looking at screens for a long time. Have you been using digital devices frequently today?",
        sender: "bot",
        time: "10:06 AM",
    }
];

const CHAT_HISTORY: HistoryItem[] = [
    {
        id: "h-1",
        topic: "Stomach Acidity Concerns",
        date: "Yesterday",
        preview: "Try avoiding spicy foods for the next 24 hours...",
    },
    {
        id: "h-2",
        topic: "Skin Rash Analysis",
        date: "Oct 12, 2026",
        preview: "Based on the image, it looks like mild contact dermatitis.",
    },
    {
        id: "h-3",
        topic: "Understanding Blood Test",
        date: "Oct 05, 2026",
        preview: "Your hemoglobin levels are within the normal range.",
    }
];

export default function ChatbotScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";

    const [viewMode, setViewMode] = useState<"chat" | "history">("chat");
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputText, setInputText] = useState("");
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [attachedFile, setAttachedFile] = useState<{ name: string, type: string } | null>(null);

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

    const toggleHistory = () => {
        Haptics.selectionAsync();
        setViewMode(prev => prev === "chat" ? "history" : "chat");
    };

    const toggleAttachmentMenu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (isAttachmentMenuOpen) {
            Animated.timing(attachMenuHeight, { toValue: 0, duration: 250, useNativeDriver: false }).start(() => setIsAttachmentMenuOpen(false));
        } else {
            setIsAttachmentMenuOpen(true);
            Animated.spring(attachMenuHeight, { toValue: 100, tension: 50, friction: 8, useNativeDriver: false }).start();
            Keyboard.dismiss();
        }
    };

    const attachMockFile = (type: string) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAttachedFile({ name: type === 'image' ? 'IMG_9241.jpg' : 'Audio_Note.m4a', type });
        toggleAttachmentMenu();
    };

    const removeAttachment = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setAttachedFile(null);
    };

    const sendMessage = () => {
        if (!inputText.trim() && !attachedFile) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        const newUserMsg: Message = {
            id: Date.now().toString(),
            text: inputText.trim() || (attachedFile ? `[Sent an ${attachedFile.type}]` : ""),
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputText("");
        setAttachedFile(null);
        setIsAttachmentMenuOpen(false);

        // Simulate Bot Typing
        setTimeout(() => {
            setMessages(prev => [
                ...prev,
                { id: "typing", text: "...", sender: "bot", time: "", isTyping: true }
            ]);

            scrollViewRef.current?.scrollToEnd({ animated: true });

            setTimeout(() => {
                setMessages(prev => prev.filter(m => m.id !== "typing"));
                const botResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "I'm an AI assistant. I've noted your response. If this is an emergency, please contact a doctor immediately.",
                    sender: "bot",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, botResponse]);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }, 1500);

        }, 500);
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
        botBubble: isDark ? "rgba(30, 41, 59, 0.7)" : "rgba(255, 255, 255, 0.7)",
        userBubble: isDark ? "rgba(14, 165, 233, 0.25)" : "rgba(14, 165, 233, 0.15)",
        userBubbleBorder: isDark ? "rgba(14, 165, 233, 0.4)" : "rgba(14, 165, 233, 0.3)",
    };

    const renderChatHistory = () => (
        <ScrollView contentContainerStyle={styles.historyContainer} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Recent Conversations</Text>
            {CHAT_HISTORY.map((item) => (
                <TouchableOpacity key={item.id} activeOpacity={0.7} onPress={toggleHistory}>
                    <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.historyCard, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>
                        <View style={styles.historyIconBox}>
                            <Ionicons name="chatbubbles-outline" size={24} color={theme.primary} />
                        </View>
                        <View style={styles.historyContent}>
                            <View style={styles.historyHeaderRow}>
                                <Text style={[styles.historyTopic, { color: theme.textPrimary }]} numberOfLines={1}>{item.topic}</Text>
                                <Text style={[styles.historyDate, { color: theme.textSecondary }]}>{item.date}</Text>
                            </View>
                            <Text style={[styles.historyPreview, { color: theme.textSecondary }]} numberOfLines={2}>{item.preview}</Text>
                        </View>
                    </BlurView>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    const renderChatMessages = () => (
        <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.chatScrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
            {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                    <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperBot]}>

                        {!isUser && (
                            <View style={[styles.botAvatar, { backgroundColor: "rgba(14, 165, 233, 0.1)" }]}>
                                <MaterialCommunityIcons name="robot-outline" size={20} color={theme.primary} />
                            </View>
                        )}

                        <BlurView
                            intensity={theme.glassIntensity + 10}
                            tint={theme.glassTint}
                            style={[
                                styles.messageBubble,
                                isUser ? styles.userBubble : styles.botBubble,
                                {
                                    backgroundColor: isUser ? theme.userBubble : theme.botBubble,
                                    borderColor: isUser ? theme.userBubbleBorder : theme.glassBorder,
                                }
                            ]}
                        >
                            {msg.isTyping ? (
                                <Text style={[styles.messageText, { color: theme.textPrimary, fontStyle: 'italic', letterSpacing: 2 }]}>{msg.text}</Text>
                            ) : (
                                <Text style={[styles.messageText, { color: theme.textPrimary }]}>{msg.text}</Text>
                            )}

                            {!msg.isTyping && (
                                <Text style={[styles.messageTime, { color: theme.textSecondary, alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>{msg.time}</Text>
                            )}
                        </BlurView>

                    </View>
                );
            })}
        </ScrollView>
    );

        const showInfo = () => {
            Alert.alert(
                "AI Health Assistant",
                "This chatbot uses artificial intelligence to provide general health information and guidance based on your questions. The responses are for informational purposes only and should NOT replace professional medical advice. Always consult a qualified doctor for diagnosis or treatment."
            );
        };
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

            {/* Header Section */}
            <BlurView intensity={theme.glassIntensity} tint={theme.glassTint} style={[styles.headerSection, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg, paddingTop: Platform.OS === 'ios' ? 50 : 35 }]}>
                <View style={styles.headerLeft}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>AI Health Assistant</Text>
                        <View style={styles.onlineIndicator}></View>
                    </View>
                    <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>Ask your health questions</Text>
                </View>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconBtn} onPress={toggleHistory}>
                        <Ionicons name={viewMode === "chat" ? "time-outline" : "chatbubble-outline"} size={22} color={theme.primary} />
                    </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.iconBtn, { backgroundColor: theme.glassBg, borderColor: theme.glassBorder }]}
                    onPress={showInfo}
                >
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
                </View>
            </BlurView>

            {/* Main Content Area */}
            {viewMode === "history" ? renderChatHistory() : renderChatMessages()}

            {/* Bottom Input Area (Only in Chat Mode) */}
            {viewMode === "chat" && (
                <BlurView intensity={theme.glassIntensity + 30} tint={theme.glassTint} style={[styles.inputContainer, { borderColor: theme.glassBorder, backgroundColor: theme.glassBg }]}>

                    {/* Attachment Preview Card */}
                    {attachedFile && (
                        <View style={[styles.attachmentPreview, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderColor: theme.glassBorder }]}>
                            <Ionicons name={attachedFile.type === 'image' ? "image-outline" : "mic-outline"} size={20} color={theme.primary} />
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
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('camera')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(14, 165, 233, 0.15)" }]}>
                                    <Ionicons name="camera-outline" size={24} color="#0EA5E9" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('audio')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                                    <Ionicons name="mic-outline" size={24} color="#F59E0B" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>Audio</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.attachOption} onPress={() => attachMockFile('document')}>
                                <View style={[styles.attachIconCircle, { backgroundColor: "rgba(139, 92, 246, 0.15)" }]}>
                                    <Ionicons name="document-text-outline" size={24} color="#8B5CF6" />
                                </View>
                                <Text style={[styles.attachOptionText, { color: theme.textPrimary }]}>Document</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </BlurView>
            )}

            {/* If in history view, show bottom nav instead of chat input */}
            {viewMode === "history" && <BottomNav activeTab="Dashboard" />}

        </KeyboardAvoidingView>
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

    /* Header Styles */
    headerSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        zIndex: 10,
    },
    headerLeft: {
        flex: 1,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginRight: 8,
    },
    onlineIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#10B981", // Green online dot
        shadowColor: "#10B981",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    headerRight: {
        flexDirection: "row",
        gap: 12,
    },
    iconBtn: {
        padding: 6,
    },

    /* History View Styles */
    historyContainer: {
        padding: 20,
        paddingBottom: 100,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 16,
    },
    historyCard: {
        flexDirection: "row",
        borderRadius: 20,
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
        overflow: "hidden",
    },
    historyIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 16,
    },
    historyContent: {
        flex: 1,
        justifyContent: "center",
    },
    historyHeaderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    historyTopic: {
        fontSize: 16,
        fontWeight: "bold",
        flex: 1,
        marginRight: 10,
    },
    historyDate: {
        fontSize: 12,
    },
    historyPreview: {
        fontSize: 14,
        lineHeight: 20,
    },

    /* Chat Messages Styles */
    chatScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    messageWrapper: {
        flexDirection: "row",
        marginBottom: 16,
        maxWidth: "85%",
    },
    messageWrapperUser: {
        alignSelf: "flex-end",
    },
    messageWrapperBot: {
        alignSelf: "flex-start",
    },
    botAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        alignSelf: "flex-end",
        marginBottom: 4,
    },
    messageBubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    userBubble: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 4,
    },
    botBubble: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderBottomRightRadius: 20,
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 6,
    },

    /* Input Area Styles */
    inputContainer: {
        borderTopWidth: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        overflow: "hidden",
    },
    attachmentPreview: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    attachmentPreviewText: {
        fontSize: 14,
        marginHorizontal: 8,
        maxWidth: 200,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    attachBtn: {
        padding: 8,
        marginRight: 4,
        marginBottom: 2,
    },
    textInput: {
        flex: 1,
        minHeight: 46,
        maxHeight: 120,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        fontSize: 15,
        marginRight: 10,
    },
    sendBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
    },
    voiceBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 2,
    },

    /* Expandable Menu Styles */
    attachmentMenu: {
        overflow: "hidden",
    },
    attachMenuContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    attachOption: {
        alignItems: "center",
        gap: 8,
    },
    attachIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
    },
    attachOptionText: {
        fontSize: 13,
        fontWeight: "500",
    },
});
