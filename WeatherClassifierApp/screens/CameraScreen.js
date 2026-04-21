import {CameraView, useCameraPermissions} from 'expo-camera';
import {useRef,useState} from 'react';
import {View,TouchableOpacity,Text,StyleSheet, ActivityIndicator} from 'react-native';
// import  ML model here

export default function CameraScreen({navigation}){
    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [facing, setFacing] = useState('back')
    const [loading, setLoading] = useState(false);
    const cameraRef = useRef();

    if (!cameraPermission?.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.text}>Camera permission is required to use this feature.</Text>
                <TouchableOpacity onPress={requestCameraPermission} style={styles.button}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const capture = async () => {
            if (cameraRef.current) {
                setLoading(true);
                try{
                const photo = await cameraRef.current.takePictureAsync();
                // const result = await //model
                //MOCK
                const result = photo.uri
                navigation.navigate('Results', {result});
                } catch (error){
                    alert('Classification failed. Please try again.');
                } finally{
                    setLoading(false);
                }
            }
    };

    return (
        <View style={styles.container}>
            <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.overlay}>
                <View style={styles.frame}></View>
            </View>
            <View style={styles.controls}>
                <TouchableOpacity onPress={() => setFacing(facing === 'back' ? 'front' : 'back')} >
                    <Text style={styles.flip}>🔄</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={capture} style={styles.captureButton} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner}/>}
                </TouchableOpacity>
                <View style={{width: 40}} />
            </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    overlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    frame: {
        width: 220,
        height: 220,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.6)',
        borderRadius: 16,
    },
    controls:{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 32,
        paddingBottom: 48,
    },
    captureButton:{
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    captureInner:{
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'white',
    },
    flip:{
        fontSize: 28,
        width: 40,
    },
    text:{
        fontSize: 15,
        color: '#333',
        marginBottom: 16,
        textAlign: 'center'
    },
    button:{
        backgroundColor: '#1c3d5a',
        padding: 14,
        borderRadius: 12
    },
    buttonText:{
        color: 'white',
        fontWeight: '500',
    },
    camera:{
        flex: 1,
    }

});