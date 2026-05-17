import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client/dist/socket.io.js';
import { SERVER_BASE_URL } from './api';

export const createSosSocket = async (): Promise<any> => {
  const token = await AsyncStorage.getItem('token');

  return io(`${SERVER_BASE_URL}/sos`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  });
};
