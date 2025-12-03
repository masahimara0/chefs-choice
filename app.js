import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  Animated, 
  Dimensions,
  Linking,
  Modal,
  FlatList
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const ENGLISH_AREAS = ['British', 'American', 'Canadian', 'Irish'];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFullInstructions, setShowFullInstructions] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.timing(splashOpacity, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 3000);
  }, []);

  useEffect(() => {
    loadFavorites();
    getRandomMeal();
  }, []);

  const loadFavorites = async () => {
    try {
      const saved = await AsyncStorage.getItem('favorites');
      if (saved) setFavorites(JSON.parse(saved));
    } catch (e) {
      console.log(e);
    }
  };

  const saveFavorite = async () => {
    if (!meal) return;
    const exists = favorites.find(f => f.idMeal === meal.idMeal);
    if (exists) return;
    
    const newFavorites = [...favorites, meal];
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (e) {
      console.log(e);
    }
  };

  const removeFavorite = async (id) => {
    const newFavorites = favorites.filter(f => f.idMeal !== id);
    setFavorites(newFavorites);
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(newFavorites));
    } catch (e) {
      console.log(e);
    }
  };

  const isFavorite = () => {
    return meal && favorites.find(f => f.idMeal === meal.idMeal);
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getRandomMeal = async () => {
    setLoading(true);
    setShowFullInstructions(false);
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.9);
    
    let foundMeal = null;
    let attempts = 0;
    const maxAttempts = 20;

    while (!foundMeal && attempts < maxAttempts) {
      try {
        const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        const data = await res.json();
        const recipe = data.meals[0];
        
        const hasVideo = recipe.strYoutube && recipe.strYoutube.trim() !== '';
        const isEnglish = ENGLISH_AREAS.includes(recipe.strArea);
        
        if (hasVideo && isEnglish) {
          foundMeal = recipe;
        }
        attempts++;
      } catch (err) {
        console.log(err);
        break;
      }
    }

    if (foundMeal) {
      setMeal(foundMeal);
      animateIn();
    }
    setLoading(false);
  };

  const openYoutube = (url) => {
    Linking.openURL(url);
  };

  const selectFavorite = (item) => {
    setMeal(item);
    setShowFavorites(false);
    setShowFullInstructions(false);
    animateIn();
  };

  const spin = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (showSplash) {
    return (
      <Animated.View style={[styles.splashContainer, { opacity: splashOpacity }]}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.splashGradient}>
          <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }, { rotate: spin }] }]}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>👨‍🍳</Text>
            </View>
          </Animated.View>

          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleTranslate }] }}>
            <Text style={styles.splashTitle}>Chef's Choice</Text>
          </Animated.View>

          <Animated.View style={{ opacity: subtitleOpacity }}>
            <Text style={styles.splashSubtitle}>Discover Delicious Recipes</Text>
          </Animated.View>

          <View style={styles.progressContainer}>
            <Animated.View 
              style={[
                styles.progressBar, 
                { 
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }) 
                }
              ]} 
            />
          </View>

          <Animated.Text style={[styles.loadingText, { opacity: subtitleOpacity }]}>
            Preparing your kitchen...
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.center}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingTextMain}>Finding English video recipes...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.container}>
      
      <Modal visible={showFavorites} animationType="slide" onRequestClose={() => setShowFavorites(false)}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>❤️ Saved Recipes</Text>
            <TouchableOpacity onPress={() => setShowFavorites(false)} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {favorites.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>No saved recipes yet</Text>
              <Text style={styles.emptySubtext}>Tap ❤️ to save your favorites</Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={(item) => item.idMeal}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => selectFavorite(item)} style={styles.favItem}>
                  <Image source={{ uri: item.strMealThumb }} style={styles.favImage} />
                  <View style={styles.favInfo}>
                    <Text style={styles.favTitle} numberOfLines={2}>{item.strMeal}</Text>
                    <Text style={styles.favArea}>{item.strArea} • {item.strCategory}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFavorite(item.idMeal)} style={styles.deleteBtn}>
                    <Text style={styles.deleteBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </LinearGradient>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerIcon}>👨‍🍳</Text>
            <View>
              <Text style={styles.headerTitle}>Chef's Choice</Text>
              <Text style={styles.headerSubtitle}>English Video Recipes</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setShowFavorites(true)} style={styles.favBadge}>
            <Text style={styles.favBadgeText}>❤️ {favorites.length}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={getRandomMeal} activeOpacity={0.8} style={styles.buttonWrapper}>
          <LinearGradient
            colors={['#ffd700', '#ff8c00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>✨ Discover New Recipe</Text>
          </LinearGradient>
        </TouchableOpacity>

        {meal && (
          <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: meal.strMealThumb }} style={styles.image} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.imageOverlay} />
              <View style={styles.imageContent}>
                <View style={styles.videoBadge}>
                  <Text style={styles.videoBadgeText}>🎥 EN Video</Text>
                </View>
                <Text style={styles.mealTitle}>{meal.strMeal}</Text>
              </View>
              
              <TouchableOpacity onPress={saveFavorite} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>{isFavorite() ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              <LinearGradient colors={['#ffd700', '#ffaa00']} style={styles.tag}>
                <Text style={styles.tagText}>🍽️ {meal.strCategory}</Text>
              </LinearGradient>
              <LinearGradient colors={['#667eea', '#764ba2']} style={styles.tag}>
                <Text style={styles.tagText}>🌍 {meal.strArea}</Text>
              </LinearGradient>
            </View>

            <View style={styles.section}>
              <TouchableOpacity onPress={() => openYoutube(meal.strYoutube)} activeOpacity={0.8}>
                <LinearGradient colors={['#ff0000', '#cc0000']} style={styles.youtubeButton}>
                  <Text style={styles.youtubeIcon}>▶️</Text>
                  <Text style={styles.youtubeText}>Watch on YouTube</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🥗</Text>
                <Text style={styles.sectionTitle}>Ingredients</Text>
              </View>
              <View style={styles.ingredientsGrid}>
                {[...Array(20)].map((_, i) => {
                  const ing = meal["strIngredient" + (i + 1)];
                  const measure = meal["strMeasure" + (i + 1)];
                  if (ing && ing.trim()) {
                    return (
                      <View key={i} style={styles.ingredientItem}>
                        <View style={styles.ingredientDot} />
                        <Text style={styles.ingredientText}>{measure} {ing}</Text>
                      </View>
                    );
                  }
                  return null;
                })}
              </View>
            </View>

            {meal.strInstructions && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionIcon}>📝</Text>
                  <Text style={styles.sectionTitle}>Instructions</Text>
                </View>
                
                <Text style={styles.instructions} numberOfLines={showFullInstructions ? undefined : 4}>
                  {meal.strInstructions}
                </Text>
                
                <TouchableOpacity onPress={() => setShowFullInstructions(!showFullInstructions)} style={styles.expandButton}>
                  <LinearGradient colors={['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.1)']} style={styles.expandButtonInner}>
                    <Text style={styles.expandButtonText}>
                      {showFullInstructions ? '▲ Show Less' : '▼ Read Full Recipe'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Premium Chef Experience</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1 },
  splashGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { marginBottom: 30 },
  logoCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,215,0,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#ffd700' },
  logoEmoji: { fontSize: 60 },
  splashTitle: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center', letterSpacing: 1 },
  splashSubtitle: { fontSize: 16, color: '#ffd700', textAlign: 'center', marginTop: 8, letterSpacing: 2 },
  progressContainer: { width: width * 0.6, height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 50, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#ffd700', borderRadius: 2 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 16 },
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loaderContainer: { alignItems: 'center' },
  loadingTextMain: { color: '#ffd700', marginTop: 16, fontSize: 16, fontWeight: '500' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingBottom: 10, paddingHorizontal: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerIcon: { fontSize: 36, marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 11, color: '#ffd700', letterSpacing: 1, textTransform: 'uppercase' },
  favBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  favBadgeText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonWrapper: { paddingHorizontal: 16, paddingVertical: 10 },
  button: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', shadowColor: '#ffd700', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  card: { margin: 16, marginTop: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)' },
  imageContainer: { position: 'relative', height: 260 },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 150 },
  imageContent: { position: 'absolute', bottom: 16, left: 16, right: 60 },
  videoBadge: { backgroundColor: 'rgba(255,0,0,0.8)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16, alignSelf: 'flex-start', marginBottom: 6 },
  videoBadgeText: { color: '#fff', fontWeight: 'bold', fontSize: 11 },
  mealTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  saveBtn: { position: 'absolute', top: 16, right: 16, backgroundColor: 'rgba(0,0,0,0.5)', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  saveBtnText: { fontSize: 22 },
  tagsContainer: { flexDirection: 'row', padding: 14, gap: 8 },
  tag: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16 },
  tagText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  section: { padding: 14, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { fontSize: 18, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#ffd700' },
  ingredientsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  ingredientItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 6 },
  ingredientDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ffd700', marginRight: 8 },
  ingredientText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, flex: 1 },
  instructions: { color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 },
  expandButton: { marginTop: 10 },
  expandButtonInner: { paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)' },
  expandButtonText: { color: '#ffd700', fontSize: 13, fontWeight: '600' },
  youtubeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, gap: 8 },
  youtubeIcon: { fontSize: 16 },
  youtubeText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  footer: { alignItems: 'center', paddingVertical: 24 },
  footerText: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#fff', fontSize: 18 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyText: { color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginTop: 8 },
  favItem: { flexDirection: 'row', alignItems: 'center', padding: 12, marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  favImage: { width: 70, height: 70, borderRadius: 12 },
  favInfo: { flex: 1, marginLeft: 12 },
  favTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  favArea: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  deleteBtn: { padding: 10 },
  deleteBtnText: { fontSize: 20 },
});
