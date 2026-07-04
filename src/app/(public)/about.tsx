import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '@/components/back-button';

const { width } = Dimensions.get("window");
const SLIDER_WIDTH = width;

const colors = {
    primary: '#00475e',
    primaryContainer: '#1a5f7a',
    secondary: '#904d00',
    secondaryContainer: '#ffa454',
    surface: '#ffffff',
    surfaceContainerLow: '#f2f4f6',
    surfaceContainer: '#eceef0',
    background: '#f8f9fc',
    onSurface: '#191c1e',
    onSurfaceVariant: '#40484d',
    outline: '#70787d',
    outlineVariant: '#c0c8cd',
};

const CAROUSEL_IMAGES = [
    require("../../../assets/images/about1.png"),
    require("../../../assets/images/about2.png"),
    require("../../../assets/images/about4.jpg"),
    require("../../../assets/images/about5.jpg"),
];

export default function AboutScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const panY = useRef(new Animated.Value(0)).current;
    const panYOffset = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                panY.setOffset(panYOffset.current);
                panY.setValue(0);
            },
            onPanResponderMove: (_, gestureState) => {
                let newY = gestureState.dy;
                if (panYOffset.current + newY < 0) {
                    newY = -panYOffset.current;
                }
                panY.setValue(newY);
            },
            onPanResponderRelease: (_, gestureState) => {
                panY.flattenOffset();
                let targetValue = 0;
                if (gestureState.dy > 50 || gestureState.vy > 0.5) {
                    targetValue = 180; // Keep dragger visible and higher
                } else if (gestureState.dy < -50 || gestureState.vy < -0.5) {
                    targetValue = 0; // Show fully
                } else {
                    targetValue = panYOffset.current > 90 ? 180 : 0;
                }

                panYOffset.current = targetValue;

                Animated.spring(panY, {
                    toValue: targetValue,
                    useNativeDriver: true,
                    bounciness: 4,
                }).start();
            }
        })
    ).current;

    useEffect(() => {
        const timer = setInterval(() => {
            const nextIndex = (currentIndex + 1) % CAROUSEL_IMAGES.length;
            flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
            setCurrentIndex(nextIndex);
        }, 3000);
        return () => clearInterval(timer);
    }, [currentIndex]);

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <BackButton />
                    <Image
                        source={require("../../../assets/images/main_logo.png")}
                        style={styles.logoImage}
                    />
                    <Text style={styles.headerTitle}>About Nogor Shomadhan</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Hero Section */}
                <View style={styles.heroContainer}>
                    <FlatList
                        ref={flatListRef}
                        data={CAROUSEL_IMAGES}
                        keyExtractor={(_, index) => index.toString()}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <Image source={item} style={styles.heroImage} />
                        )}
                    />
                    <View style={styles.heroOverlay}>
                        <Text style={styles.heroTitle}>Building Better Communities Together</Text>
                        <Text style={styles.heroDesc}>
                            Empowering citizens and city management through transparent, tech-driven collaboration to build a better, safer, and more efficient city for everyone.
                        </Text>
                    </View>
                </View>

                {/* What We Do */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>What We Do</Text>

                    <View style={styles.gridContainer}>
                        <View style={styles.gridCard}>
                            <MaterialIcons name="trip-origin" size={32} color={colors.primary} />
                            <Text style={styles.gridCardText}>Potholes</Text>
                        </View>
                        <View style={styles.gridCard}>
                            <MaterialIcons name="build" size={32} color={colors.primary} />
                            <Text style={styles.gridCardText}>Road Damage</Text>
                        </View>
                        <View style={styles.gridCard}>
                            <MaterialIcons name="lightbulb-outline" size={32} color={colors.primary} />
                            <Text style={styles.gridCardText}>Streetlights</Text>
                        </View>
                        <View style={styles.gridCard}>
                            <MaterialIcons name="delete-outline" size={32} color={colors.primary} />
                            <Text style={styles.gridCardText}>Waste Mgmt</Text>
                        </View>
                    </View>

                    <View style={styles.infoAlert}>
                        <MaterialIcons name="info-outline" size={24} color={colors.secondary} />
                        <Text style={styles.infoAlertText}>
                            All reports are reviewed by the authorities to take further actions which can be traced by the residents
                        </Text>
                    </View>
                </View>

                {/* How It Works */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { textAlign: 'center' }]}>How It Works</Text>

                    <View style={styles.stepperContainer}>
                        <View style={styles.stepperLine} />

                        <View style={styles.stepItem}>
                            <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepNumber}>1</Text>
                            </View>
                            <View style={styles.stepCard}>
                                <MaterialIcons name="photo-camera" size={20} color={colors.primary} />
                                <View style={styles.stepTextContent}>
                                    <Text style={styles.stepTitle}>Report</Text>
                                    <Text style={styles.stepDesc}>Snap photo and location.</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepItem}>
                            <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepNumber}>2</Text>
                            </View>
                            <View style={styles.stepCard}>
                                <MaterialIcons name="location-on" size={20} color={colors.primary} />
                                <View style={styles.stepTextContent}>
                                    <Text style={styles.stepTitle}>AI Checks for Duplicacy</Text>
                                    <Text style={styles.stepDesc}>Automatic verification.</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepItem}>
                            <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepNumber}>3</Text>
                            </View>
                            <View style={styles.stepCard}>
                                <MaterialIcons name="assignment" size={20} color={colors.primary} />
                                <View style={styles.stepTextContent}>
                                    <Text style={styles.stepTitle}>Authority Reviews</Text>
                                    <Text style={styles.stepDesc}>Work order approved.</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.stepItem}>
                            <View style={[styles.stepCircle, { backgroundColor: colors.primary }]}>
                                <Text style={styles.stepNumber}>4</Text>
                            </View>
                            <View style={styles.stepCard}>
                                <MaterialIcons name="people" size={20} color={colors.primary} />
                                <View style={styles.stepTextContent}>
                                    <Text style={styles.stepTitle}>Work Begins</Text>
                                    <Text style={styles.stepDesc}>Repairs in progress.</Text>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.stepItem, { marginBottom: 0 }]}>
                            <View style={[styles.stepCircle, { backgroundColor: colors.secondary }]}>
                                <Text style={styles.stepNumber}>5</Text>
                            </View>
                            <View style={styles.stepCard}>
                                <MaterialIcons name="check-circle-outline" size={20} color={colors.secondary} />
                                <View style={styles.stepTextContent}>
                                    <Text style={[styles.stepTitle, { color: colors.secondary }]}>Issue Resolved</Text>
                                    <Text style={styles.stepDesc}>Community is fixed!</Text>
                                </View>
                            </View>
                        </View>

                    </View>
                </View>

                {/* Key Features */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Features</Text>
                    <View style={styles.featuresGrid}>

                        <View style={styles.featureItem}>
                            <MaterialIcons name="location-pin" size={24} color={colors.secondary} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Photos/Location</Text>
                                <Text style={styles.featureDesc}>Precise reporting.</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <MaterialIcons name="category" size={24} color={colors.secondary} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>AI Categorization</Text>
                                <Text style={styles.featureDesc}>Smart filtering.</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <MaterialIcons name="show-chart" size={24} color={colors.secondary} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Real-Time Tracking</Text>
                                <Text style={styles.featureDesc}>Status updates.</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <MaterialIcons name="notifications-active" size={24} color={colors.secondary} />
                            <View style={styles.featureTextContainer}>
                                <Text style={styles.featureTitle}>Instant Alerts</Text>
                                <Text style={styles.featureDesc}>Stay informed.</Text>
                            </View>
                        </View>

                    </View>
                </View>

                {/* Why Choose Nogor Shomadhan? */}
                <View style={[styles.section, { paddingHorizontal: 16 }]}>
                    <View style={styles.darkCard}>
                        <Text style={styles.darkCardTitle}>Why Choose Nogor Shomadhan?</Text>

                        <View style={styles.checkItem}>
                            <MaterialIcons name="check-circle-outline" size={20} color={colors.secondaryContainer} />
                            <Text style={styles.checkItemText}>Direct access to community authorities.</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <MaterialIcons name="check-circle-outline" size={20} color={colors.secondaryContainer} />
                            <Text style={styles.checkItemText}>100% Transparency in report handling.</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <MaterialIcons name="check-circle-outline" size={20} color={colors.secondaryContainer} />
                            <Text style={styles.checkItemText}>Faster resolution through digital automation.</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <MaterialIcons name="check-circle-outline" size={20} color={colors.secondaryContainer} />
                            <Text style={styles.checkItemText}>Community-driven urban improvement.</Text>
                        </View>
                    </View>
                </View>

                {/* Our Vision */}
                <View style={styles.section}>
                    <Image
                        source={require("../../../assets/images/about3.png")}
                        style={styles.visionImage}
                    />
                    <View style={styles.visionCard}>
                        <Text style={styles.visionTitle}>Our Vision</Text>
                        <Text style={styles.visionText}>
                            To transform every urban center into a smart city where technology serves humanity, creating a seamless feedback loop between residents and their surroundings for a cleaner, safer, and more comfortable living environment.
                        </Text>
                    </View>
                </View>


            </ScrollView>

            {/* CTAs & Footer */}
            <Animated.View style={[styles.bottomSection, { transform: [{ translateY: panY }] }]}>
                <View {...panResponder.panHandlers} style={styles.dragHandleContainer}>
                    <View style={styles.dragHandle} />
                </View>

                <View style={styles.ctaContainer}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.push('/(public)/register')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.primaryButtonText}>Register</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => router.push('/(public)/sign-in')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.secondaryButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.footerLinks}>
                    <TouchableOpacity onPress={() => router.push('/(public)/about')}>
                        <Text style={styles.footerLinkText}>About</Text>
                    </TouchableOpacity>
                    <View style={styles.footerDot} />
                    <TouchableOpacity onPress={() => router.push('/(public)/impact')}>
                        <Text style={styles.footerLinkText}>Impact</Text>
                    </TouchableOpacity>
                    <View style={styles.footerDot} />
                    <TouchableOpacity onPress={() => router.push('/(public)/contact')}>
                        <Text style={styles.footerLinkText}>Contact</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: colors.background,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    logoImage: {
        width: 28,
        height: 28,
        borderRadius: 6,
    },
    headerTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
    },
    content: {
        paddingBottom: 280,
    },
    heroContainer: {
        width: '100%',
        height: 240,
        position: 'relative',
        backgroundColor: colors.primary,
    },
    heroImage: {
        width: SLIDER_WIDTH,
        height: 240,
        resizeMode: 'cover',
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 71, 94, 0.65)',
        paddingHorizontal: 24,
        paddingBottom: 24,
        justifyContent: 'flex-end',
    },
    heroTitle: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: colors.surface,
        marginBottom: 8,
    },
    heroDesc: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.surface,
        lineHeight: 20,
        opacity: 0.9,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 24,
    },
    sectionTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 16,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    gridCard: {
        width: '48%',
        backgroundColor: colors.surface,
        paddingVertical: 20,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(192,200,205,0.2)',
    },
    gridCardText: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
        marginTop: 12,
        textAlign: 'center',
    },
    infoAlert: {
        flexDirection: 'row',
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        borderWidth: 1,
        borderColor: 'rgba(144, 77, 0, 0.1)',
        alignItems: 'center',
    },
    infoAlertText: {
        flex: 1,
        fontFamily: 'Inter',
        fontSize: 13,
        color: colors.onSurfaceVariant,
        marginLeft: 12,
        lineHeight: 18,
    },
    stepperContainer: {
        position: 'relative',
        paddingLeft: 32,
        paddingRight: 16,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 400,
    },
    stepperLine: {
        position: 'absolute',
        left: 43,
        top: 20,
        bottom: 40,
        width: 2,
        borderStyle: 'dotted',
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        borderRadius: 1,
        zIndex: 0,
    },
    stepItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        position: 'relative',
    },
    stepCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 0,
        zIndex: 2,
    },
    stepNumber: {
        color: colors.surface,
        fontSize: 12,
        fontWeight: '700',
    },
    stepCard: {
        backgroundColor: colors.surface,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 40,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(192,200,205,0.2)',
    },
    stepTextContent: {
        marginLeft: 12,
        flex: 1,
    },
    stepTitle: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    stepDesc: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.onSurfaceVariant,
        marginTop: 2,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        justifyContent: 'space-between',
    },
    featureItem: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    featureTextContainer: {
        marginLeft: 8,
        flex: 1,
    },
    featureTitle: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
    featureDesc: {
        fontFamily: 'Inter',
        fontSize: 12,
        color: colors.onSurfaceVariant,
        marginTop: 2,
    },
    darkCard: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    darkCardTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '700',
        color: colors.surface,
        marginBottom: 16,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    checkItemText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.surface,
        marginLeft: 12,
        flex: 1,
    },
    visionImage: {
        width: '100%',
        height: 180,
        borderRadius: 16,
        marginBottom: -24,
        zIndex: 1,
    },
    visionCard: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: 16,
        padding: 24,
        paddingTop: 40,
        zIndex: 0,
    },
    visionTitle: {
        fontFamily: 'Inter',
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 8,
    },
    visionText: {
        fontFamily: 'Inter',
        fontSize: 14,
        color: colors.onSurfaceVariant,
        lineHeight: 22,
    },

    bottomSection: {
        backgroundColor: '#f2f4f6',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    dragHandleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 4,
    },
    dragHandle: {
        width: 48,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: colors.outlineVariant,
    },
    ctaContainer: {
        gap: 12,
        marginBottom: 32,
    },
    primaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: '#00475e',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: '#ffffff',
    },
    secondaryButton: {
        width: '100%',
        height: 56,
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#00475e',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Inter',
        fontSize: 20,
        fontWeight: '700',
        color: '#00475e',
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    footerLinkText: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '600',
        color: '#40484d',
    },
    footerDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#c0c8cd',
    },
});
