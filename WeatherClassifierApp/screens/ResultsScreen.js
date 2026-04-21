import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

const WEATHER_META = {
  dew:        { icon: '💧', color: '#4A90D9', bg: '#E8F4FD', desc: 'Moisture condensed on cool surfaces' },
  fogsmog:    { icon: '🌫️', color: '#78909C', bg: '#ECEFF1', desc: 'Thick low-lying cloud at ground level' },
  fog:        { icon: '🌫️', color: '#78909C', bg: '#ECEFF1', desc: 'Thick low-lying cloud at ground level' },
  frost:      { icon: '❄️', color: '#5C9BD6', bg: '#E3F2FD', desc: 'Ice crystals formed on surfaces below 0°C' },
  glaze:      { icon: '🧊', color: '#4FC3F7', bg: '#E1F5FE', desc: 'Smooth ice coating from freezing rain' },
  hail:       { icon: '🌨️', color: '#546E7A', bg: '#ECEFF1', desc: 'Balls of ice falling during thunderstorms' },
  lightning:  { icon: '⚡', color: '#F9A825', bg: '#FFFDE7', desc: 'Electrical discharge during storms' },
  rain:       { icon: '🌧️', color: '#1976D2', bg: '#E3F2FD', desc: 'Water droplets falling from clouds' },
  rainbow:    { icon: '🌈', color: '#E91E63', bg: '#FCE4EC', desc: 'Optical phenomenon caused by refracted sunlight' },
  rime:       { icon: '🌨️', color: '#90CAF9', bg: '#E3F2FD', desc: 'White granular ice deposited by freezing fog' },
  sandstorm:  { icon: '🌪️', color: '#FF8F00', bg: '#FFF8E1', desc: 'Dust and sand particles carried by strong winds' },
  snow:       { icon: '❄️', color: '#42A5F5', bg: '#E3F2FD', desc: 'Frozen precipitation in crystalline form' },
};

export default function ResultsScreen({ navigation, route }) {
  const { result } = route.params;
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    classifyImage();
  }, []);

  const classifyImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: result }),
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      setPrediction(data);
    } catch (err) {
      setError('Could not connect to the classification server. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const meta = prediction
    ? (WEATHER_META[prediction.label?.toLowerCase()] || { icon: '🌡️', color: '#1c3d5a', bg: '#E6F1FB', desc: 'Weather condition detected' })
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.backText}>← Home</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Results</Text>
          <View style={{ width: 60 }} />
        </View>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#1c3d5a" />
            <Text style={styles.loadingText}>Analyzing weather condition...</Text>
            <Text style={styles.loadingSubtext}>Running EfficientNet-B0 model</Text>
          </View>
        )}

        {!loading && error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Classification Failed</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={classifyImage}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && prediction && meta && (
          <>
            <View style={[styles.resultCard, { backgroundColor: meta.bg, borderColor: meta.color + '33' }]}>
              <Text style={styles.resultIcon}>{meta.icon}</Text>
              <Text style={[styles.resultLabel, { color: meta.color }]}>
                {prediction.label?.charAt(0).toUpperCase() + prediction.label?.slice(1)}
              </Text>
              <Text style={styles.resultDesc}>{meta.desc}</Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceRow}>
                  <Text style={styles.confidenceLabel}>Confidence</Text>
                  <Text style={[styles.confidencePct, { color: meta.color }]}>
                    {(prediction.confidence * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.confidenceBarBg}>
                  <View style={[styles.confidenceBarFill, {
                    width: `${(prediction.confidence * 100).toFixed(1)}%`,
                    backgroundColor: meta.color,
                  }]} />
                </View>
              </View>
            </View>

            {prediction.top_predictions && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>All Predictions</Text>
                {prediction.top_predictions.map((item, idx) => {
                  const m = WEATHER_META[item.label?.toLowerCase()] || { icon: '🌡️', color: '#aaa' };
                  return (
                    <View key={item.label} style={styles.predRow}>
                      <View style={styles.predLeft}>
                        <Text style={styles.predRank}>{idx + 1}</Text>
                        <Text style={styles.predIcon}>{m.icon}</Text>
                        <Text style={styles.predName}>
                          {item.label?.charAt(0).toUpperCase() + item.label?.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.predRight}>
                        <View style={styles.predBarBg}>
                          <View style={[styles.predBarFill, {
                            width: `${(item.confidence * 100).toFixed(1)}%`,
                            backgroundColor: idx === 0 ? m.color : '#ccc',
                          }]} />
                        </View>
                        <Text style={[styles.predPct, idx === 0 && { color: m.color, fontWeight: '600' }]}>
                          {(item.confidence * 100).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Upload')} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>📁  Try Another Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')} activeOpacity={0.85}>
                <Text style={styles.secondaryButtonText}>← Back to Home</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Text style={styles.footer}>Powered by EfficientNet-B0 · Weather Classifier v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0ee' },
  container: { padding: 14, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: '#1c3d5a', fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  loadingCard: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', gap: 12, marginTop: 40, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  loadingText: { fontSize: 16, fontWeight: '500', color: '#111', marginTop: 8 },
  loadingSubtext: { fontSize: 13, color: '#aaa' },
  errorCard: { backgroundColor: '#FFF3F3', borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, marginTop: 40, borderWidth: 0.5, borderColor: '#FFCDD2' },
  errorIcon: { fontSize: 40, marginBottom: 4 },
  errorTitle: { fontSize: 17, fontWeight: '600', color: '#C62828' },
  errorText: { fontSize: 13, color: '#666', textAlign: 'center', lineHeight: 20 },
  retryButton: { backgroundColor: '#1c3d5a', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  retryText: { color: 'white', fontWeight: '500', fontSize: 14 },
  resultCard: { borderRadius: 22, padding: 28, alignItems: 'center', borderWidth: 1, marginBottom: 16 },
  resultIcon: { fontSize: 64, marginBottom: 10 },
  resultLabel: { fontSize: 32, fontWeight: '700', marginBottom: 6 },
  resultDesc: { fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  confidenceContainer: { width: '100%' },
  confidenceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  confidenceLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
  confidencePct: { fontSize: 13, fontWeight: '700' },
  confidenceBarBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' },
  confidenceBarFill: { height: '100%', borderRadius: 4 },
  section: { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.07)' },
  sectionLabel: { fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 14 },
  predRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  predLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 130 },
  predRank: { fontSize: 12, color: '#bbb', fontWeight: '600', width: 14 },
  predIcon: { fontSize: 16 },
  predName: { fontSize: 13, color: '#333', fontWeight: '500' },
  predRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  predBarBg: { flex: 1, height: 6, backgroundColor: '#f0f0ee', borderRadius: 3, overflow: 'hidden' },
  predBarFill: { height: '100%', borderRadius: 3 },
  predPct: { fontSize: 12, color: '#aaa', width: 40, textAlign: 'right' },
  actions: { gap: 8, marginBottom: 16 },
  primaryButton: { backgroundColor: '#1c3d5a', borderRadius: 14, padding: 16, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 15, fontWeight: '500' },
  secondaryButton: { backgroundColor: 'white', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  secondaryButtonText: { color: '#1c3d5a', fontSize: 15, fontWeight: '500' },
  footer: { textAlign: 'center', fontSize: 11, color: '#ccc', marginTop: 8 },
});