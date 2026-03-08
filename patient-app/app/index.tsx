import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Dimensions,
  useColorScheme,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import API_URL from "../services/api";
import LottieView from "lottie-react-native";
import doctorani from "../assets/animations/Doctor.json";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Animations
  const slideAnim = useRef(new Animated.Value(height * 0.6)).current; // Start the sheet off-screen
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPassFocused, setIsPassFocused] = useState(false);

  useEffect(() => {
    // Reveal the Bottom Sheet and Header softly
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

    checkBiometricAvailability();
    checkBiometricLogin();
  }, []);

  const checkBiometricAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const checkBiometricLogin = async () => {
    const token = await AsyncStorage.getItem("token");
    const biometricEnabled = await AsyncStorage.getItem("biometricEnabled");

    if (token && biometricEnabled === "true" && biometricAvailable) {
      handleBiometricLogin();
    }
  };

  const onPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("Required", "Please enter your email and password.");
        return;
      }

      setLoading(true);

      // Simulate API call delay for smooth UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "patient",
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials. Please try again.");
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      if (biometricAvailable) {
        await AsyncStorage.setItem("biometricEnabled", "true");
      }

      // Exit Animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace("/patient/patientdashboard");
      });
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in with Biometrics",
        cancelLabel: "Cancel",
        fallbackLabel: "Use Password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          router.replace("/patient/patientdashboard");
        });
      }
    } catch (error) {
      Alert.alert("Authentication Failed", "Please use your password to continue.");
    }
  };

  // Dynamic colors based on theme
  const theme = {
    bgTop: isDark ? ["#0D1B2A", "#1B263B"] : ["#E3F2FD", "#FFFFFF"],
    bgSheet: isDark ? "#1E1E1E" : "#FFFFFF",
    textPrimary: isDark ? "#FFFFFF" : "#212121",
    textSecondary: isDark ? "#A0A0A0" : "#757575",
    inputBg: isDark ? "#2A2A2A" : "#F5F5F5",
    inputBorderActive: isDark ? "#4FC3F7" : "#1E88E5",
    iconColor: isDark ? "#818181" : "#9E9E9E",
    btnColor: isDark ? "#4FC3F7" : "#1E88E5",
    divider: isDark ? "#3A3A3A" : "#EEEEEE",
    circle1: isDark ? "rgba(79, 195, 247, 0.15)" : "rgba(187, 222, 251, 0.3)",
    circle2: isDark ? "rgba(187, 222, 251, 0.05)" : "rgba(187, 222, 251, 0.3)"
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: theme.bgTop[0] }]}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header Area (Top Section) */}
      <Animated.View style={[styles.headerContainer, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={theme.bgTop}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        <View style={styles.floatingCircles}>
          <View style={[styles.circle, styles.circle1, { backgroundColor: theme.circle1 }]} />
          <View style={[styles.circle, styles.circle2, { backgroundColor: theme.circle2 }]} />
        </View>

        <View style={styles.lottieWrapper}>
          <LottieView
            source={doctorani}
            autoPlay
            loop
            style={styles.lottie}
            resizeMode="cover"
          />
        </View>
      </Animated.View>

      {/* Interactive Sheet Form (Bottom Section) */}
      <Animated.View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: theme.bgSheet,
            transform: [{ translateY: slideAnim }],
            opacity: fadeAnim,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Greeting Typography */}
          <View style={styles.titleSection}>
            <Text style={[styles.greetingText, { color: theme.textPrimary }]}>Welcome back,</Text>
            <Text style={[styles.subGreetingText, { color: theme.textSecondary }]}>Sign in to your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={[
              styles.inputGroup,
              { backgroundColor: theme.inputBg },
              isEmailFocused && [styles.inputGroupFocused, { borderColor: theme.inputBorderActive, backgroundColor: isDark ? "#121212" : "#FFFFFF" }]
            ]}>
              <Ionicons
                name="mail"
                size={20}
                color={isEmailFocused ? theme.inputBorderActive : theme.iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="Email Address"
                placeholderTextColor={theme.iconColor}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            <View style={[
              styles.inputGroup,
              { backgroundColor: theme.inputBg },
              isPassFocused && [styles.inputGroupFocused, { borderColor: theme.inputBorderActive, backgroundColor: isDark ? "#121212" : "#FFFFFF" }]
            ]}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={isPassFocused ? theme.inputBorderActive : theme.iconColor}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder="Password"
                placeholderTextColor={theme.iconColor}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPassFocused(true)}
                onBlur={() => setIsPassFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  color={theme.iconColor}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={[styles.forgotText, { color: theme.btnColor }]}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Primary Action */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: theme.btnColor, shadowColor: theme.btnColor }]}
                onPress={handleLogin}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? "#1E1E1E" : "#FFFFFF"} />
                ) : (
                  <Text style={[styles.loginBtnText, { color: isDark ? "#0A0A0A" : "#FFFFFF" }]}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            {/* Alternative Login */}
            {biometricAvailable && (
              <View style={styles.biometricSection}>
                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
                  <Text style={[styles.dividerText, { color: theme.iconColor }]}>or continue with</Text>
                  <View style={[styles.dividerLine, { backgroundColor: theme.divider }]} />
                </View>

                <TouchableOpacity
                  style={[styles.biometricBtn, { backgroundColor: theme.inputBg, borderColor: theme.divider }]}
                  onPress={handleBiometricLogin}
                  activeOpacity={0.7}
                >
                  <Ionicons name="finger-print" size={26} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footerSection}>
            <Text style={[styles.footerBaseText, { color: theme.textSecondary }]}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={[styles.footerActionText, { color: theme.btnColor }]}>Sign up.</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flex: 0.45,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  floatingCircles: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circle1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    right: -width * 0.2,
  },
  circle2: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: -width * 0.1,
    left: -width * 0.1,
  },
  lottieWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: "100%",
    height: "100%",
  },
  sheetContainer: {
    flex: 0.70,
    marginTop: -100, // Overlaps the header slightly
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 100,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 20,
  },
  titleSection: {
    marginBottom: 32,
  },
  greetingText: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subGreetingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  formSection: {
    flex: 1,
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    height: 64,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 20,
  },
  inputGroupFocused: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "500",
  },
  eyeIcon: {
    marginLeft: 10,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 32,
    paddingVertical: 5,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "700",
  },
  loginBtn: {
    height: 60,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loginBtnText: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  biometricSection: {
    marginTop: 32,
    alignItems: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  biometricBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerBaseText: {
    fontSize: 15,
  },
  footerActionText: {
    fontSize: 15,
    fontWeight: "bold",
  },
  bottomSpacer: {
    height: 40,
  },
});