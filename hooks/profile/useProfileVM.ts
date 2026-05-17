import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/store/store';
import { fetchProfile, updateProfile, uploadPhoto, performLogout } from '@/store/authSlice';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

export const useProfileVM = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, loading, error } = useSelector((state: RootState) => state.auth);
    const [isUploading, setIsUploading] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            await dispatch(fetchProfile()).unwrap();
        } catch (err) {
            console.error('Failed to load profile:', err);
        }
    }, [dispatch]);

    const handleUpdateProfile = async (data: any) => {
        try {
            await dispatch(updateProfile(data)).unwrap();
            Alert.alert('Succès', 'Profil mis à jour avec succès');
            return true;
        } catch (err: any) {
            Alert.alert('Erreur', err || 'Échec de la mise à jour');
            return false;
        }
    };


    const handlePickAndUploadImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', "L'accès à la galerie est requis.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });


        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            const formData = new FormData();
            
            // @ts-ignore
            formData.append('photo', {
                uri: asset.uri,
                name: asset.fileName || 'photo.jpg',
                type: asset.mimeType || 'image/jpeg',
            });

            setIsUploading(true);
            try {
                await dispatch(uploadPhoto(formData)).unwrap();
                Alert.alert('Succès', 'Photo de profil mise à jour');
            } catch (err: any) {
                Alert.alert('Erreur', err || 'Échec du téléchargement');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleLogout = async () => {
        try {
            await dispatch(performLogout()).unwrap();
        } catch (err) {
            console.error('Logout error:', err);
        }
    };


    return {
        user,
        loading,
        isUploading,
        error,
        loadProfile,
        handleUpdateProfile,
        handlePickAndUploadImage,
        handleLogout,
    };
};
