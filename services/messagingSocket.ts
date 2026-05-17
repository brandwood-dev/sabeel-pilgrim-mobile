import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client/dist/socket.io.js';
import { SERVER_BASE_URL } from './api';

export const createMessagingSocket = async (): Promise<any> => {
  const token = await AsyncStorage.getItem('token');

  return io(`${SERVER_BASE_URL}/messaging`, {
    transports: ['websocket', 'polling'],
    auth: {
      token,
    },
  });
};
