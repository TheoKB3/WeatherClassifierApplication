import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen({ navigation }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.main}>
          <Text style={styles.under}>Weather Detection</Text>
          <Text style={styles.today}>{today}</Text>
          <Text style={styles.icon}>🌡️</Text>
          <Text style={styles.temp}>--°F</Text>
          <Text style={styles.desc}>Choose a photo or use your camera to identify the weather condition</Text>
          <View style={styles.row}>
            <View style={styles.section}><Text style={styles.sectionText}>11 Conditions</Text></View>
            <View style={styles.section}><Text style={styles.sectionText}>Instant Results</Text></View>
            <View style={styles.section}><Text style={styles.sectionText}>ML Powered</Text></View>
          </View>
        </View>

        <Text style={styles.label}>Get Started</Text>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Camera')} activeOpacity={0.8}>
          <View style={[styles.cardIcon, { backgroundColor: '#E6F1FB' }]}>
            <Text style={{ fontSize: 26 }}>📸</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.textTitle}>Use Camera</Text>
            <Text style={styles.textDesc}>Take a photo of the sky to identify the weather condition</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Upload')} activeOpacity={0.8}>
          <View style={[styles.cardIcon, { backgroundColor: '#E6F1EE' }]}>
            <Text style={{ fontSize: 26 }}>📁</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.textTitle}>Upload a Photo</Text>
            <Text style={styles.textDesc}>Choose a photo to use from your library</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>Available Conditions</Text>
        <View style={styles.grid}>
          {[
            { icon: '🌧️', label: 'Rain' },
            { icon: '❄️', label: 'Snow' },
            { icon: '🌫️', label: 'Fog' },
            { icon: '❄️', label: 'Frost' },
            { icon: '⚡', label: 'Lightning' },
            { icon: '🌨️', label: 'Hail' },
            { icon: '🌈', label: 'Rainbow' },
            { icon: '🌪️', label: 'Sandstorm' },
            { icon: '💧', label: 'Dew' },
            { icon: '🧊', label: 'Glaze' },
            { icon: '🌨️', label: 'Rime' },
          ].map(item => (
            <View key={item.label} style={styles.conditions}>
              <Text style={{ fontSize: 16 }}>{item.icon}</Text>
              <Text style={styles.conditionLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: 20 }}>
            Notice: Photos will be used in a machine learning model
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0ee' },
  container: { padding: 14, paddingBottom: 32 },
  main: {
    backgroundColor: '#1c3d5a',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  under: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 2,
  },
  today: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  icon: { fontSize: 44, marginBottom: 4 },
  temp: { fontSize: 32, color: '#fff', fontWeight: '300', lineHeight: 68, marginBottom: 8 },
  desc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 20,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  row: { flexDirection: 'row', gap: 6 },
  section: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 0.5,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sectionText: { fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' },
  label: {
    fontSize: 10,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  textTitle: { fontSize: 15, fontWeight: '500', color: '#111', marginBottom: 2 },
  textDesc: { fontSize: 13, color: '#aaa' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  conditions: {
    backgroundColor: 'white',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  conditionLabel: { fontSize: 13, color: '#555', fontWeight: '500' },
  footer: { marginTop: 32 },
});