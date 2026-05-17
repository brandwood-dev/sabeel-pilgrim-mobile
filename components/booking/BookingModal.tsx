import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const PRIMARY_COLOR = '#2C5F2D';
const TEXT_LIGHT = '#666';

interface BookingModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (date: string, people: string) => void;
    title?: string;
    dateLabel?: string;
    peopleLabel?: string;
    submitLabel?: string;
    note?: string;
    availableDates?: string[];
}

export default function BookingModal({
    visible,
    onClose,
    onSubmit,
    title = 'Réserver',
    dateLabel = 'Choisir une date',
    peopleLabel = 'Nombre de personnes',
    submitLabel = 'Confirmer',
    note = 'Votre demande sera transmise pour validation.',
    availableDates = [],
}: BookingModalProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [numberOfPeople, setNumberOfPeople] = useState('1');

    const handleSubmit = () => {
        if (selectedDate && numberOfPeople) {
            onSubmit(selectedDate, numberOfPeople);
            // Reset for next time if needed, though usually handled by parent
            setSelectedDate(null);
            setNumberOfPeople('1');
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Date Selection */}
                        <Text style={styles.sectionLabel}>{dateLabel}</Text>
                        <View style={styles.datesGrid}>
                            {availableDates.map((date) => (
                                <TouchableOpacity
                                    key={date}
                                    style={[
                                        styles.dateChip,
                                        selectedDate === date && styles.dateChipSelected
                                    ]}
                                    onPress={() => setSelectedDate(date)}
                                >
                                    <Text style={[
                                        styles.dateChipText,
                                        selectedDate === date && styles.dateChipTextSelected
                                    ]}>
                                        {new Date(date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short'
                                        })}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Number of People */}
                        <Text style={styles.sectionLabel}>{peopleLabel}</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Ex: 2"
                            keyboardType="numeric"
                            value={numberOfPeople}
                            onChangeText={setNumberOfPeople}
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                (!selectedDate || !numberOfPeople) && styles.submitButtonDisabled
                            ]}
                            onPress={handleSubmit}
                            disabled={!selectedDate || !numberOfPeople}
                        >
                            <Text style={styles.submitButtonText}>{submitLabel}</Text>
                        </TouchableOpacity>

                        <Text style={styles.modalNote}>{note}</Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 8,
    },
    datesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    dateChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    dateChipSelected: {
        backgroundColor: `${PRIMARY_COLOR}15`,
        borderColor: PRIMARY_COLOR,
    },
    dateChipText: {
        fontSize: 14,
        fontWeight: '500',
        color: TEXT_LIGHT,
    },
    dateChipTextSelected: {
        color: PRIMARY_COLOR,
        fontWeight: '600',
    },
    modalInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 15,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 16,
    },
    submitButton: {
        backgroundColor: PRIMARY_COLOR,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    submitButtonDisabled: {
        backgroundColor: '#D1D5DB',
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    modalNote: {
        fontSize: 12,
        color: TEXT_LIGHT,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});
