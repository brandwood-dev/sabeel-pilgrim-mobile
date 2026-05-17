import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useThemeColors } from '../../hooks/useThemeColors';

const { width, height } = Dimensions.get('window');

const PENDING_PILGRIM_IDENTIFIER_KEY = 'pending_pilgrim_identifier';

export default function CompanionQRScannerScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const flow = String((params as any)?.flow || '');
    const colors = useThemeColors();
    const [manualId, setManualId] = useState('');
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const isLinkFlow = flow === 'link';

    const processPilgrimIdentification = async (idToProcess: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            if (isLinkFlow) {
                await AsyncStorage.setItem(PENDING_PILGRIM_IDENTIFIER_KEY, idToProcess);
                router.back();
                return;
            }
            const { authApi } = await import('@/services/api');
            
            const response = await authApi.findPilgrimByIdentifier(idToProcess);
            const pilgrim = response.data;

            Alert.alert(
                "Pèlerin Trouvé",
                `Connecté à ${pilgrim.firstName} ${pilgrim.lastName}.`,
                [{ text: "Démarrer le Suivi", onPress: () => router.replace('/(accampagnant)/map_tracking') }]
            );
        } catch (error: any) {
            console.error('Identification error:', error);
            const errorMsg = error.response?.data?.message || "Impossible de trouver ce pèlerin. Vérifiez l'ID et assurez-vous que le partage de position est activé.";
            Alert.alert("Identification Échouée", errorMsg);
            setScanned(false);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmScan = () => {
        if (manualId.trim().length > 0) {
            processPilgrimIdentification(manualId.trim());
        } else {
            Alert.alert("Identifiant Requis", "Veuillez entrer un ID ou scanner un code QR.");
        }
    };

    const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
        if (scanned || isProcessing) return;
        setScanned(true);
        
        let idToUse = data;
        try {
            const parsed = JSON.parse(data);
            if (parsed.id) idToUse = parsed.id;
        } catch (e) {
            // Not a JSON, use raw data
        }
        
        setManualId(idToUse);
        processPilgrimIdentification(idToUse);
    };

    if (!permission) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2C5F2D" />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContainer}>
                    <MaterialCommunityIcons name="camera-off" size={64} color="#6B7280" />
                    <Text style={styles.permissionTitle}>Accès à la caméra requis</Text>
                    <Text style={styles.permissionDesc}>
                        Nous avons besoin de votre permission pour utiliser la caméra afin de scanner le code QR.
                    </Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()} style={styles.cancelBtn}>
                        <Text style={styles.cancelBtnText}>Annuler</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={26} color="#2C5F2D" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Scanner le Code QR</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {/* Visual Scanner Area */}
                <View style={styles.scannerContainer}>
                    <View style={styles.scannerBox}>
                        {/* Real Camera View */}
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            facing="back"
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ["qr"],
                            }}
                        >
                            {/* Scanner Frame Overlay */}
                            <View style={styles.overlay}>
                                {/* Scanner Frame Corners */}
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />

                                {/* Animated Scan Line */}
                                <View style={styles.scanLine} />
                            </View>
                        </CameraView>
                    </View>
                    <Text style={styles.scanInstruction}>
                        Alignez le code QR dans le cadre pour scanner automatiquement
                    </Text>
                </View>

                {/* ID Input Fallback */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.inputSection}>
                        <Text style={styles.inputLabel}>OU ENTRER L'ID MANUELLEMENT</Text>
                        <View style={styles.idInputWrapper}>
                            <MaterialCommunityIcons name="identifier" size={20} color="#4A7C59" style={styles.inputIcon} />
                            <TextInput
                                style={styles.idInput}
                                placeholder="ID du pèlerin (ex: PIL-123)"
                                value={manualId}
                                onChangeText={setManualId}
                                autoCapitalize="characters"
                                placeholderTextColor="#9CA3AF"
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </View>

            {/* Confirmation Footer */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.confirmButton, isProcessing && { opacity: 0.7 }]} 
                    onPress={handleConfirmScan}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialCommunityIcons name="check-circle" size={24} color="#fff" />
                            <Text style={styles.confirmButtonText}>Confirmer l'identifiant</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#2C5F2D',
        marginTop: 20,
        textAlign: 'center',
    },
    permissionDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginTop: 12,
        lineHeight: 20,
        marginBottom: 30,
    },
    permissionButton: {
        backgroundColor: '#2C5F2D',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    permissionButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelBtn: {
        marginTop: 20,
        padding: 10,
    },
    cancelBtnText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        height: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 40,
    },
    scannerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    scannerBox: {
        width: width * 0.75,
        height: width * 0.75,
        backgroundColor: '#000',
        borderRadius: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#FFFFFF',
        borderWidth: 5,
    },
    topLeft: {
        top: 0,
        left: 0,
        borderRightWidth: 0,
        borderBottomWidth: 0,
        borderTopLeftRadius: 25,
    },
    topRight: {
        top: 0,
        right: 0,
        borderLeftWidth: 0,
        borderBottomWidth: 0,
        borderTopRightRadius: 25,
    },
    bottomLeft: {
        bottom: 0,
        left: 0,
        borderRightWidth: 0,
        borderTopWidth: 0,
        borderBottomLeftRadius: 25,
    },
    bottomRight: {
        bottom: 0,
        right: 0,
        borderLeftWidth: 0,
        borderTopWidth: 0,
        borderBottomRightRadius: 25,
    },
    scanLine: {
        width: '80%',
        height: 2,
        backgroundColor: '#2C5F2D',
        borderRadius: 2,
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    scanInstruction: {
        marginTop: 24,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    keyboardView: {
        width: '100%',
        paddingHorizontal: 24,
    },
    inputSection: {
        width: '100%',
    },
    inputLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#9CA3AF',
        letterSpacing: 1.2,
        marginBottom: 12,
        textAlign: 'center',
    },
    idInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    inputIcon: {
        marginRight: 12,
    },
    idInput: {
        flex: 1,
        fontSize: 16,
        color: '#2C5F2D',
        fontWeight: '600',
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        backgroundColor: '#FFFFFF',
    },
    confirmButton: {
        backgroundColor: '#2C5F2D',
        height: 56,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        elevation: 4,
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
