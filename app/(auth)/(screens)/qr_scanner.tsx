import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { useRouter } from 'expo-router';
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
} from 'react-native';
import { Button } from '../../../components/ui/Button';

const { width } = Dimensions.get('window');

export default function QRScannerScreen() {
    const router = useRouter();
    const [manualId, setManualId] = useState('');
    const [scanning, setScanning] = useState(true);

    const handleLink = () => {
        // Link logic here
        router.replace('/(accampagnant)/home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <FontAwesome5 name="arrow-left" size={20} color="#2C5F2D" />
                </TouchableOpacity>
                <Text style={styles.title}>Lier un pèlerin</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.content}
            >
                <View style={styles.scannerWrapper}>
                    <View style={styles.scannerFrame}>
                        {/* Mock Scanner UI */}
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />

                        <View style={styles.scanLine} />

                        <FontAwesome5 name="qrcode" size={100} color="rgba(44, 95, 45, 0.2)" />
                    </View>
                    <Text style={styles.scanInstructions}>
                        Cadrez le QR code du pèlerin dans le carré
                    </Text>
                </View>

                <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.dividerText}>OU ENTRER L'ID</Text>
                    <View style={styles.line} />
                </View>

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <FontAwesome5 name="id-card" size={18} color="#4A7C59" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="SABEEL-XXX-XX"
                            value={manualId}
                            onChangeText={setManualId}
                            autoCapitalize="characters"
                        />
                    </View>
                    <Button
                        title="Lier le profil"
                        onPress={handleLink}
                        disabled={!manualId && scanning}
                        style={styles.linkButton}
                    />
                </View>
            </KeyboardAvoidingView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.demoButton}
                    onPress={() => router.replace('/(accampagnant)/home')}
                >
                    <Text style={styles.demoButtonText}>Simuler un scan réussi (Démo)</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F4DF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    backButton: {
        padding: 8,
        marginRight: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2C5F2D',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scannerWrapper: {
        alignItems: 'center',
        marginBottom: 40,
    },
    scannerFrame: {
        width: width * 0.7,
        height: width * 0.7,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E8E6D0',
        position: 'relative',
        overflow: 'hidden',
    },
    corner: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderColor: '#2C5F2D',
    },
    topLeft: {
        top: 20,
        left: 20,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 10,
    },
    topRight: {
        top: 20,
        right: 20,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 10,
    },
    bottomLeft: {
        bottom: 20,
        left: 20,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 10,
    },
    bottomRight: {
        bottom: 20,
        right: 20,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 10,
    },
    scanLine: {
        position: 'absolute',
        width: '80%',
        height: 2,
        backgroundColor: '#2C5F2D',
        top: '50%',
        shadowColor: '#2C5F2D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 5,
    },
    scanInstructions: {
        marginTop: 20,
        fontSize: 14,
        color: '#4A7C59',
        fontWeight: '500',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 30,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E8E6D0',
    },
    dividerText: {
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#4A7C59',
        opacity: 0.6,
    },
    inputContainer: {
        width: '100%',
        gap: 16,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#E8E6D0',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#2C5F2D',
        fontWeight: '600',
    },
    linkButton: {
        height: 56,
        borderRadius: 16,
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    demoButton: {
        padding: 10,
    },
    demoButtonText: {
        color: '#B8860B',
        fontSize: 14,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
});
