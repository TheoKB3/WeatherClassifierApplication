import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function UploadScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const analyze = async () => {
    if (!image?.base64) return;
    setLoading(true);
    try {
      const result = image.base64;
      navigation.navigate('Results', { result });
    } catch (error) {
      alert('Classification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Upload Photo</Text>
          <View style={{ width: 60 }} />
        </View>

        <TouchableOpacity
          style={[styles.imageArea, image && styles.imageAreaFilled]}
          onPress={pickImage}
          activeOpacity={0.85}
        >
          {image ? (
            <>
              <Image source={{ uri: image.uri }} style={styles.preview} />
              <TouchableOpacity style={styles.changeButton} onPress={pickImage}>
                <Text style={styles.changeText}>Change Photo</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.emptyFrame}>
              <View style={styles.emptyIcon}>
                <Text style={{ fontSize: 28 }}>📁</Text>
              </View>
              <Text style={styles.emptyText}>Tap to select a photo</Text>
              <Text style={styles.emptySubtext}>JPG · PNG · HEIC</Text>
            </View>
          )}
        </TouchableOpacity>

        {image && (
          <View style={styles.info}>
            <View style={styles.infoSec}>
              <Text style={styles.infoText}>Image Selected</Text>
            </View>
            <Text style={styles.infoDesc}>Tap the image to change it</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.analyzeButton, (!image || loading) && styles.analyzeButtonDisabled]}
          onPress={analyze}
          disabled={!image || loading}
          activeOpacity={0.85}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.analyzeText}>Analyze Weather</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f0f0ee' },
  container: { flex: 1, padding: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 15, color: '#1c3d5a', fontWeight: '500' },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  imageArea: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageAreaFilled: { borderStyle: 'solid', borderColor: 'rgba(0,0,0,0.08)' },
  preview: { width: '100%', height: '100%' },
  changeButton: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeText: { color: 'white', fontSize: 12, fontWeight: '500' },
  emptyFrame: { alignItems: 'center', gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#f5f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#aaa',
  },
  emptyText: { fontSize: 15, fontWeight: '500', color: '#333' },
  emptySubtext: { fontSize: 13, color: '#aaa' },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoSec: {
    backgroundColor: '#E1F5EE',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  infoText: { fontSize: 12, color: '#1D9E75', fontWeight: '500' },
  infoDesc: { fontSize: 12, color: '#bbb' },
  analyzeButton: {
    backgroundColor: '#1c3d5a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  analyzeButtonDisabled: { opacity: 0.3 },
  analyzeText: { color: 'white', fontSize: 15, fontWeight: '500' },
});