import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    Animated,
    Alert,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import authAPI from '../api/auth';
import { API_BASE_URL } from '../api/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const Auth = ({ navigation }) => {
    const [activeScreen, setActiveScreen] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // const navigation = useNavigation();

    // Animation values
    const fadeAnim = new Animated.Value(1);
    const slideAnim = new Animated.Value(0);

    // Form validation
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) newErrors.email = 'Email is required';
        else if (!emailRegex.test(email)) newErrors.email = 'Invalid email format';

        // Password validation
        if (!password) newErrors.password = 'Password is required';
        else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';

        // Additional validations for signup
        if (activeScreen === 'signup') {
            if (!name) newErrors.name = 'Name is required';
            if (!confirmPassword) newErrors.confirmPassword = 'Please confirm password';
            else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Animation functions
    const animateTransition = (newScreen) => {
        Animated.sequence([
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.timing(slideAnim, {
                toValue: 50,
                duration: 0,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setActiveScreen(newScreen);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    // Authentication functions
    const handleLogin = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('username', email); // FastAPI OAuth expects 'username' for email
            formData.append('password', password);

            console.log('API URL:', `${API_BASE_URL}/auth/token`); // Log full URL

            const response = await fetch(`${API_BASE_URL}/auth/token`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || 'An error occurred');
            }
            await AsyncStorage.setItem('access_token', data.access_token);
            console.log(navigation)
            navigation.navigate('Recipe');
            Alert.alert('Success', 'Logged in successfully');
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: name,
                    email: email,
                    password: password
                })
            });

            // First handle the API response
            const result = await response.json();

            if (response.ok) {
                // Alert.alert(
                //     'Success',
                //     'Account created successfully',
                //     [
                //         {
                //             text: 'OK',
                //             onPress: () => animateTransition('login')
                //         }
                //     ]
                // );
                navigation.navigate('Recipe');
                return result;
            } else {
                // Handle error response from server
                throw new Error(result.detail || 'Registration failed');
            }
        } catch (error) {
            Alert.alert('Error', error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    // Update your handleForgotPassword function
    const handleForgotPassword = async () => {
        if (!email) {
            setErrors({ email: 'Email is required' });
            return;
        }

        try {
            setLoading(true);
            await authAPI.resetPassword(email);
            Alert.alert('Success', 'Password reset email sent', [
                {
                    text: 'OK',
                    onPress: () => animateTransition('login')
                }
            ]);
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const ErrorMessage = ({ error }) => (
        error ? <Text style={styles.errorText}>{error}</Text> : null
    );

    const renderLogin = () => (
        <Animated.View
            style={[
                styles.formContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
            />
            <ErrorMessage error={errors.email} />

            <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    setErrors({ ...errors, password: null });
                }}
                secureTextEntry
                editable={!loading}
            />
            <ErrorMessage error={errors.password} />

            <TouchableOpacity
                onPress={() => animateTransition('forgot')}
                style={styles.forgotButton}
                disabled={loading}
            >
                <Text style={styles.forgotButtonText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.mainButton, loading && styles.mainButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.mainButtonText}>Login</Text>
                )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Don't have an account? </Text>
                <TouchableOpacity
                    onPress={() => animateTransition('signup')}
                    disabled={loading}
                >
                    <Text style={styles.switchButtonText}>Sign Up</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderSignup = () => (
        <Animated.View
            style={[
                styles.formContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="Full Name"
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    setErrors({ ...errors, name: null });
                }}
                editable={!loading}
            />
            <ErrorMessage error={errors.name} />

            <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
            />
            <ErrorMessage error={errors.email} />

            <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    setErrors({ ...errors, password: null });
                }}
                secureTextEntry
                editable={!loading}
            />
            <ErrorMessage error={errors.password} />

            <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                    setConfirmPassword(text);
                    setErrors({ ...errors, confirmPassword: null });
                }}
                secureTextEntry
                editable={!loading}
            />
            <ErrorMessage error={errors.confirmPassword} />

            <TouchableOpacity
                style={[styles.mainButton, loading && styles.mainButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.mainButtonText}>Sign Up</Text>
                )}
            </TouchableOpacity>

            <View style={styles.switchContainer}>
                <Text style={styles.switchText}>Already have an account? </Text>
                <TouchableOpacity
                    onPress={() => animateTransition('login')}
                    disabled={loading}
                >
                    <Text style={styles.switchButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    const renderForgotPassword = () => (
        <Animated.View
            style={[
                styles.formContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to reset password</Text>

            <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setErrors({ ...errors, email: null });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
            />
            <ErrorMessage error={errors.email} />

            <TouchableOpacity
                style={[styles.mainButton, loading && styles.mainButtonDisabled]}
                onPress={handleForgotPassword}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.mainButtonText}>Reset Password</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => animateTransition('login')}
                disabled={loading}
            >
                <Text style={styles.backButtonText}>Back to Login</Text>
            </TouchableOpacity>
        </Animated.View>
    );

    const handleApiResponse = async (response) => {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        return data;
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoid}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Image style={styles.logoImage} source={require('D:/Self-Learnt/React/MealPlanner/assets/cooking.png')} />
                        <Text style={styles.logoName}>Meal Planner</Text>
                    </View>
                    {activeScreen === 'login' && renderLogin()}
                    {activeScreen === 'signup' && renderSignup()}
                    {activeScreen === 'forgot' && renderForgotPassword()}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoid: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    formContainer: {
        padding: 20,
        width: width * 0.9,
        alignSelf: 'center',
        backgroundColor: 'white',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 24,
        textAlign: 'center',
    },
    logoName: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 10,
        marginBottom: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#eee',
    },
    inputError: {
        borderColor: '#ff6b6b',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff6b6b',
        fontSize: 12,
        marginBottom: 8,
        marginLeft: 4,
    },
    mainButton: {
        backgroundColor: '#007AFF',
        padding: 16,
        borderRadius: 10,
        marginTop: 8,
    },
    mainButtonDisabled: {
        backgroundColor: '#007AFF80',
    },
    mainButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: 'bold',
    },
    forgotButton: {
        alignSelf: 'flex-end',
        marginBottom: 16,
    },
    forgotButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    switchText: {
        color: '#666',
        fontSize: 14,
    },
    switchButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    backButton: {
        marginTop: 16,
    },
    backButtonText: {
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    logoImage: {
        width: 150,
        height: 150,
        // marginBottom: 20,
        alignSelf: 'center',
    },
});

export default Auth;