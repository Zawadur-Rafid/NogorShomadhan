import { MaterialIcons } from '@expo/vector-icons';
import { Image, type ImageSource } from 'expo-image';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { palette, styles } from './community-home-styles';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type HeroSlide = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: ImageSource;
};

type Feature = {
  icon: IconName;
  title: string;
  description: string;
};

const slides: HeroSlide[] = [
  {
    id: 'report',
    eyebrow: 'REPORT IN MINUTES',
    title: 'See it. Report it. Improve your community.',
    description: 'Share a photo, location, and a few details so the right community authority can respond.',
    image: require('@/assets/images/public/home/report-community-issue.png'),
  },
  {
    id: 'track',
    eyebrow: 'FOLLOW EVERY UPDATE',
    title: 'Know what is happening, every step of the way.',
    description: 'Track progress, notes, photos, and budget updates from assignment through completion.',
    image: require('@/assets/images/public/home/authority-work-update.png'),
  },
  {
    id: 'resolve',
    eyebrow: 'CLOSE THE LOOP',
    title: 'Proof of work. A stronger neighborhood.',
    description: 'See completion evidence, confirm the outcome, and share feedback that builds accountability.',
    image: require('@/assets/images/public/home/community-resolution.png'),
  },
];

const workflow: (Feature & { number: string })[] = [
  { number: '01', icon: 'person-add-alt-1', title: 'Create a verified account', description: 'Register once so every report has a trusted community source.' },
  { number: '02', icon: 'add-a-photo', title: 'Report the issue', description: 'Add a photo, category, location, urgency, and a short description.' },
  { number: '03', icon: 'engineering', title: 'Follow authority updates', description: 'See status, work notes, evidence, and budget changes as they happen.' },
  { number: '04', icon: 'rate-review', title: 'Confirm and give feedback', description: 'Review completion proof and rate the response for your community.' },
];

const categories: { icon: IconName; label: string }[] = [
  { icon: 'water-damage', label: 'Drainage' },
  { icon: 'lightbulb-outline', label: 'Streetlights' },
  { icon: 'water-drop', label: 'Water supply' },
  { icon: 'add-road', label: 'Road damage' },
  { icon: 'delete-outline', label: 'Waste' },
];

function PublicLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {(['about', 'impact', 'contact'] as const).map((route) => (
        <Link key={route} href={`/${route}`} asChild>
          <Pressable onPress={onNavigate} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}>
            <Text style={styles.navLinkText}>{route[0].toUpperCase() + route.slice(1)}</Text>
          </Pressable>
        </Link>
      ))}
    </>
  );
}

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <View style={styles.sectionIntro}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionDescription}>{description}</Text>
    </View>
  );
}

export default function CommunityHomeScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const isTablet = width >= 640;
  const scrollRef = useRef<ScrollView>(null);
  const carouselRef = useRef<FlatList<HeroSlide>>(null);
  const mainOffsetRef = useRef(0);
  const workflowOffsetRef = useRef(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(Math.max(width - 24, 1));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((current) => {
        const next = (current + 1) % slides.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleCarouselLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && Math.abs(nextWidth - carouselWidth) > 1) {
      setCarouselWidth(nextWidth);
      requestAnimationFrame(() => carouselRef.current?.scrollToIndex({ index: activeSlide, animated: false }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style='dark' />
      <ScrollView ref={scrollRef} style={styles.screen} contentContainerStyle={styles.screenContent} contentInsetAdjustmentBehavior='automatic' showsVerticalScrollIndicator={false}>
        <View style={styles.headerShell}>
          <View style={styles.header}>
            <Link href='/' asChild>
              <Pressable accessibilityLabel='Nogor Shomadhan home' style={({ pressed }) => [styles.brand, pressed && styles.pressed]}>
                <Image source={require('@/assets/images/main_logo.png')} style={styles.logo} contentFit='contain' />
                {isDesktop || width >= 520 ? (
                  <View style={styles.brandCopy}>
                    <Text style={styles.brandName}>Nogor Shomadhan</Text>
                    <Text style={styles.brandTagline}>Community issues, solved together</Text>
                  </View>
                ) : null}
              </Pressable>
            </Link>
            {isDesktop ? (
              <>
                <View style={styles.desktopNav}><PublicLinks /></View>
                <View style={styles.headerActions}>
                  <Pressable onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.signInButton, pressed && styles.pressed]}>
                    <Text style={styles.signInText}>Sign in</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/register')} style={({ pressed }) => [styles.headerRegister, pressed && styles.pressed]}>
                    <Text style={styles.headerRegisterText}>Register</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.mobileHeaderActions}>
                <Pressable onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.mobileSignIn, pressed && styles.pressed]}>
                  <Text style={styles.mobileSignInText}>Sign in</Text>
                </Pressable>
                <Pressable onPress={() => router.push('/register')} style={({ pressed }) => [styles.mobileRegisterTop, pressed && styles.pressed]}>
                  <Text style={styles.mobileRegisterTopText}>Register</Text>
                </Pressable>
                <Pressable accessibilityLabel={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} onPress={() => setMenuOpen((value) => !value)} style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}>
                  <MaterialIcons name={menuOpen ? 'close' : 'menu'} size={25} color={palette.teal} />
                </Pressable>
              </View>
            )}
          </View>
          {!isDesktop && menuOpen ? (
            <View style={styles.mobileMenu}>
              <View style={styles.mobileMenuLinks}><PublicLinks onNavigate={() => setMenuOpen(false)} /></View>
            </View>
          ) : null}
        </View>
        <View style={styles.mainContent} onLayout={(event) => { mainOffsetRef.current = event.nativeEvent.layout.y; }}>
          <View style={styles.heroCarousel} onLayout={handleCarouselLayout}>
            <FlatList
              ref={carouselRef}
              data={slides}
              horizontal
              pagingEnabled
              bounces={false}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({ length: carouselWidth, offset: carouselWidth * index, index })}
              onMomentumScrollEnd={(event) => setActiveSlide(Math.round(event.nativeEvent.contentOffset.x / carouselWidth))}
              renderItem={({ item }) => (
                <View style={[styles.heroSlide, { width: carouselWidth, minHeight: isDesktop ? 560 : 570 }]}>
                  <Image source={item.image} style={styles.fill} contentFit='cover' transition={300} />
                  <View style={styles.heroShade} />
                  <View style={[styles.heroCopy, isDesktop && styles.heroCopyDesktop]}>
                    <View style={styles.eyebrow}>
                      <MaterialIcons name='groups' size={16} color={palette.white} />
                      <Text style={styles.eyebrowText}>{item.eyebrow}</Text>
                    </View>
                    <Text style={[styles.heroTitle, isDesktop && styles.heroTitleDesktop]}>{item.title}</Text>
                    <Text style={[styles.heroDescription, isDesktop && styles.heroDescriptionDesktop]}>{item.description}</Text>
                    <View style={styles.heroActions}>
                      <Pressable onPress={() => router.push('/register')} style={({ pressed }) => [styles.heroPrimary, pressed && styles.pressed]}>
                        <Text style={styles.heroPrimaryText}>Register & report</Text>
                        <MaterialIcons name='arrow-forward' size={19} color={palette.tealDark} />
                      </Pressable>
                      <Pressable
                        onPress={() => scrollRef.current?.scrollTo({ y: Math.max(workflowOffsetRef.current - 20, 0), animated: true })}
                        style={({ pressed }) => [styles.heroSecondary, pressed && styles.pressed]}
                      >
                        <MaterialIcons name='play-circle-outline' size={20} color={palette.white} />
                        <Text style={styles.heroSecondaryText}>See how it works</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            />
            <View style={styles.carouselControls}>
              {slides.map((slide, index) => (
                <Pressable
                  key={slide.id}
                  accessibilityLabel={`Show slide ${index + 1}`}
                  hitSlop={8}
                  onPress={() => {
                    setActiveSlide(index);
                    carouselRef.current?.scrollToIndex({ index, animated: true });
                  }}
                  style={[styles.carouselDot, index === activeSlide && styles.carouselDotActive]}
                />
              ))}
            </View>
          </View>
          <View
            style={styles.section}
            onLayout={(event) => { workflowOffsetRef.current = mainOffsetRef.current + event.nativeEvent.layout.y; }}
          >
            <SectionIntro
              eyebrow='A SIMPLE, VISIBLE PROCESS'
              title='How Nogor Shomadhan works'
              description='Community knowledge starts the report. Transparent authority updates finish the job.'
            />
            <View style={styles.cardGrid}>
              {workflow.map((step) => (
                <View
                  key={step.number}
                  style={[
                    styles.workflowCard,
                    isDesktop ? styles.fourColumnCard : isTablet ? styles.twoColumnCard : styles.oneColumnCard,
                  ]}
                >
                  <View style={styles.workflowCardTop}>
                    <View style={styles.stepIcon}><MaterialIcons name={step.icon} size={24} color={palette.teal} /></View>
                    <Text style={styles.stepNumber}>{step.number}</Text>
                  </View>
                  <Text style={styles.workflowTitle}>{step.title}</Text>
                  <Text style={styles.workflowDescription}>{step.description}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.section, styles.categorySection]}>
            <View style={styles.categoryHeader}>
              <SectionIntro
                eyebrow='MADE FOR EVERYDAY COMMUNITY NEEDS'
                title='What can you report?'
                description='Send common neighborhood maintenance issues to the people responsible for them.'
              />
              <Link href='/register' asChild>
                <Pressable style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}>
                  <Text style={styles.textActionLabel}>Start a report</Text>
                  <MaterialIcons name='north-east' size={19} color={palette.teal} />
                </Pressable>
              </Link>
            </View>
            <View style={styles.categoryGrid}>
              {categories.map((category) => (
                <View key={category.label} style={styles.categoryCard}>
                  <View style={styles.categoryIcon}>
                    <MaterialIcons name={category.icon} size={25} color={palette.teal} />
                  </View>
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.ctaSection}>
            <View style={styles.ctaGlow} />
            <View style={styles.ctaIcon}><MaterialIcons name='location-on' size={27} color={palette.tealDark} /></View>
            <Text style={styles.ctaEyebrow}>YOUR COMMUNITY STARTS WITH YOU</Text>
            <Text style={styles.ctaTitle}>Notice something that needs attention?</Text>
            <Text style={styles.ctaDescription}>Create your verified account and make the first report in just a few minutes.</Text>
            <View style={styles.ctaActions}>
              <Pressable onPress={() => router.push('/register')} style={({ pressed }) => [styles.ctaPrimary, pressed && styles.pressed]}>
                <Text style={styles.ctaPrimaryText}>Create an account</Text>
                <MaterialIcons name='arrow-forward' size={19} color={palette.tealDark} />
              </Pressable>
              <Pressable onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.ctaSecondary, pressed && styles.pressed]}>
                <Text style={styles.ctaSecondaryText}>I already have an account</Text>
              </Pressable>
            </View>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.footerBrand}>
            <Image source={require('@/assets/images/main_logo.png')} style={styles.footerLogo} contentFit='contain' />
            <View>
              <Text style={styles.footerBrandName}>Nogor Shomadhan</Text>
              <Text style={styles.footerBrandLine}>Better communities through shared action.</Text>
            </View>
          </View>
          <View style={styles.footerNav}><PublicLinks /></View>
          <Text style={styles.copyright}>© 2026 Nogor Shomadhan</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
