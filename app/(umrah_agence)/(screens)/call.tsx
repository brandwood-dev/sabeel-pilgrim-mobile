import { useThemeColors } from '@/hooks/useThemeColors';
import { createMessagingSocket } from '@/services/messagingSocket';
import { messagingApi, SERVER_BASE_URL } from '@/services/api';
import { RootState } from '@/store/store';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  mediaDevices,
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
} from 'react-native-webrtc';
import InCallManager from 'react-native-incall-manager';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
  StatusBar,
} from 'react-native';
import { useSelector } from 'react-redux';
import { getIncomingOffer, popIncomingOffer } from '@/services/callCache';
import { Audio } from 'expo-av';
import * as NavigationBar from 'expo-navigation-bar';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const { height } = Dimensions.get('window');

type CallUiState = 'incoming' | 'calling' | 'in_call' | 'ended' | 'offline';

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentUserId = currentUser?.id;

  const callId = typeof params.callId === 'string' && params.callId ? params.callId : `call-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const fromUserId = typeof params.fromUserId === 'string' ? params.fromUserId : '';
  const targetUserId = typeof params.targetUserId === 'string' ? params.targetUserId : '';
  const fromRole = typeof params.fromRole === 'string' ? params.fromRole : '';
  const isSender = typeof params.type === 'string' && params.type === 'sender';
  const initialState = isSender ? 'calling' : 'incoming';
  const conversationIdParam = typeof params.conversationId === 'string' ? params.conversationId : '';

  const displayName = useMemo(() => {
    if (typeof params.name === 'string' && params.name.trim()) return params.name;
    if (fromRole === 'guide' || fromRole === 'agency' || fromRole === 'freelance') return 'Guide';
    return 'Appel';
  }, [params.name, fromRole]);

  const displayPhoto = typeof params.photo === 'string' ? params.photo : '';

  const normalizePhotoForMetadata = (value: unknown) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) return `${SERVER_BASE_URL}${trimmed}`;
    const host = String(SERVER_BASE_URL || '')
      .replace(/^https?:\/\//i, '')
      .replace(/:\d+$/, '')
      .replace(/\/+$/, '');
    if (!host) return '';
    const encoded = trimmed
      .split('/')
      .map((s) => encodeURIComponent(s))
      .join('/');
    return `http://${host}:9000/images/${encoded}`;
  };

  const callerNameForMetadata = useMemo(() => {
    const firstName = currentUser?.firstName ? String(currentUser.firstName) : '';
    const lastName = currentUser?.lastName ? String(currentUser.lastName) : '';
    const full = `${firstName} ${lastName}`.trim();
    return full || 'Appel';
  }, [currentUser?.firstName, currentUser?.lastName]);

  const callerPhotoForMetadata = useMemo(() => {
    const raw = (currentUser as any)?.photo || (currentUser as any)?.imageUrl || '';
    return normalizePhotoForMetadata(raw);
  }, [currentUser]);

  const remoteUserId = isSender ? targetUserId : fromUserId;

  const [uiState, setUiState] = useState<CallUiState>(initialState as CallUiState);
  const [socketConnected, setSocketConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [timer, setTimer] = useState(0);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<any>(null);

  const socketRef = useRef<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const callStartAtRef = useRef<number | null>(null);
  const ringAnimation = useSharedValue(1);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRingtone = async () => {
    try {
      if (soundRef.current) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
        playThroughEarpieceAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require('@/../assets/images/sonne.mp3'),
        { shouldPlay: true, isLooping: true },
      );
      soundRef.current = sound;
    } catch {
      // ignore
    }
  };

  const stopRingtone = async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    } catch {
      // ignore
    }
  };

  const resolveConversationIdForSummary = async (): Promise<string> => {
    if (conversationIdParam) return conversationIdParam;
    try {
      const res = await messagingApi.getMyConversations();
      const list = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.conversations) ? res.data.conversations : []);
      const currentId = currentUserId ? String(currentUserId) : '';
      const remoteId = remoteUserId ? String(remoteUserId) : '';
      if (!currentId || !remoteId) return '';

      const match = list.find((c: any) => {
        const pilgrimUserId = c?.pilgrimUserId ? String(c.pilgrimUserId) : '';
        const guideId = c?.guideId ? String(c.guideId) : '';
        if (pilgrimUserId && guideId) {
          return pilgrimUserId === currentId && guideId === remoteId;
        }
        return false;
      });
      return match?.id ? String(match.id) : '';
    } catch {
      return '';
    }
  };

  const persistCallDurationToChat = async (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    try {
      const conversationId = await resolveConversationIdForSummary();
      if (!conversationId) return;
      await messagingApi.sendMessage(conversationId, { content: `Appel terminé - Durée: ${formatTime(seconds)}` });
    } catch {
      // ignore
    }
  };

  const missedPersistedRef = useRef(false);
  const persistMissedCallToChat = async () => {
    if (!isSender) return;
    if (missedPersistedRef.current) return;
    missedPersistedRef.current = true;
    try {
      const conversationId = await resolveConversationIdForSummary();
      if (!conversationId) return;
      await messagingApi.sendMessage(conversationId, { content: 'Appel manqué' });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    try {
      StatusBar.setHidden(true, 'fade');
    } catch {}

    (async () => {
      try {
        if (Platform.OS === 'android') {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
        }
      } catch {}
    })();

    return () => {
      try {
        StatusBar.setHidden(false, 'fade');
      } catch {}
      (async () => {
        try {
          if (Platform.OS === 'android') {
            await NavigationBar.setVisibilityAsync('visible');
          }
        } catch {}
      })();
    };
  }, []);

  const cleanupWebrtc = async () => {
    try {
      const pc = peerRef.current;
      peerRef.current = null;
      if (pc) {
        try {
          (pc as any).onicecandidate = null;
          (pc as any).ontrack = null;
          pc.close();
        } catch {}
      }

      const stream = localStreamRef.current;
      localStreamRef.current = null;
      if (stream?.getTracks) {
        try {
          stream.getTracks().forEach((t: any) => t.stop && t.stop());
        } catch {}
      }
    } catch {}

    try {
      InCallManager.stop();
    } catch {}

    await stopRingtone();

    try {
      Vibration.cancel();
    } catch {}
  };

  useEffect(() => {
    ringAnimation.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupSocket = async () => {
      try {
        const socket = await createMessagingSocket();
        socketRef.current = socket;

        socket.on('connect', () => {
          if (!isMounted) return;
          setSocketConnected(true);
          if (uiState === 'offline') setUiState(initialState as CallUiState);
        });

        socket.on('disconnect', () => {
          if (!isMounted) return;
          setSocketConnected(false);
        });

        socket.on('connect_error', () => {
          if (!isMounted) return;
          setSocketConnected(false);
          setUiState('offline');
        });

        socket.on('call_end', (payload: any) => {
          if (payload?.callId && payload.callId !== callId) return;
          setUiState('ended');
          if (uiState !== 'in_call') {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            persistMissedCallToChat();
          }
          const seconds = callStartAtRef.current ? Math.max(0, Math.round((Date.now() - callStartAtRef.current) / 1000)) : 0;
          callStartAtRef.current = null;
          setTimer(0);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          persistCallDurationToChat(seconds);
          cleanupWebrtc();
          setTimeout(() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(umrah_agence)/(screens)/acceuil' as any);
          }, 400);
        });

        socket.on('call_ice_candidate', async (payload: any) => {
          if (payload?.callId && payload.callId !== callId) return;
          const pc = peerRef.current;
          if (!pc || !payload?.candidate) return;
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {}
        });

        socket.on('call_unavailable', (payload: any) => {
          if (payload?.callId && payload.callId !== callId) return;
          if (uiState !== 'in_call') {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            persistMissedCallToChat();
          }
          setUiState('ended');
          callStartAtRef.current = null;
          setTimer(0);
          cleanupWebrtc();
          setTimeout(() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(umrah_agence)/(screens)/acceuil' as any);
          }, 400);
        });

        socket.on('call_answer', async (payload: any) => {
          if (payload?.callId && payload.callId !== callId) return;
          if (!payload?.sdp) return;
          const pc = peerRef.current;
          if (!pc) return;
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            setUiState('in_call');
            callStartAtRef.current = Date.now();
            setTimer(0);
            await stopRingtone();
          } catch {}
        });
      } catch (e) {
        setUiState('offline');
      }
    };

    setupSocket();

    return () => {
      isMounted = false;
      cleanupWebrtc();
      if (socketRef.current) socketRef.current.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  useEffect(() => {
    let interval: any;
    if (uiState === 'in_call') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [uiState]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringAnimation.value }],
    opacity: 2 - ringAnimation.value,
  }));

  const avatarUri =
    displayPhoto ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(String(displayName || 'User'))}&background=2C5F2D&color=fff`;

  useEffect(() => {
    if (uiState === 'calling' || uiState === 'incoming') {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      startRingtone();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    stopRingtone();
  }, [uiState]);

  useEffect(() => {
    if (!isSender) return;
    if (!socketConnected) return;
    if (!remoteUserId || !currentUserId) return;

    const run = async () => {
      try {
        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;

        try {
          InCallManager.start({ media: 'audio' } as any);
          InCallManager.setSpeakerphoneOn(isSpeakerOn);
        } catch {}

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerRef.current = pc;

        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });

        try {
          stream.getAudioTracks?.().forEach((t: any) => {
            t.enabled = !isMuted;
          });
        } catch {}

        (pc as any).onicecandidate = (event: any) => {
          const candidate = event?.candidate;
          if (!candidate) return;
          try {
            socketRef.current?.emit('call_ice_candidate', {
              callId,
              targetUserId: remoteUserId,
              candidate,
            });
          } catch {}
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketRef.current?.emit('call_offer', {
          callId,
          targetUserId: remoteUserId,
          sdp: offer,
          metadata: {
            name: callerNameForMetadata,
            photo: callerPhotoForMetadata,
          },
        });
      } catch (e: any) {
        setUiState('offline');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSender, socketConnected, remoteUserId, callerNameForMetadata, callerPhotoForMetadata]);

  useEffect(() => {
    if (uiState !== 'calling') return;
    if (!isSender) return;
    const t = setTimeout(() => {
      if (uiState !== 'calling') return;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      persistMissedCallToChat();
      endCall();
    }, 30000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState, isSender, callId]);

  const endCall = () => {
    try {
      if (socketRef.current && callId && remoteUserId) {
        socketRef.current.emit('call_end', { callId, targetUserId: remoteUserId });
      }
    } catch {
      // ignore
    }

    const seconds = callStartAtRef.current ? Math.max(0, Math.round((Date.now() - callStartAtRef.current) / 1000)) : 0;
    callStartAtRef.current = null;
    setTimer(0);
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    persistCallDurationToChat(seconds);

    cleanupWebrtc();

    if (router.canGoBack()) router.back();
    else router.replace('/(umrah_agence)/(screens)/acceuil' as any);
  };

  const answerCall = () => {
    if (!socketConnected) {
      Alert.alert('Connexion', 'Pas de connexion Internet.');
      return;
    }

    if (!callId || !fromUserId || !currentUserId) {
      Alert.alert('Erreur', 'Appel invalide');
      endCall();
      return;
    }

    setUiState('in_call');

    const run = async () => {
      try {
        const cached = getIncomingOffer(callId) || popIncomingOffer(callId);
        if (!cached?.sdp) {
          Alert.alert('Erreur', 'Offer SDP manquante');
          endCall();
          return;
        }

        const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;

        try {
          InCallManager.start({ media: 'audio' } as any);
          InCallManager.setSpeakerphoneOn(isSpeakerOn);
        } catch {}

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerRef.current = pc;

        stream.getTracks().forEach((track: any) => {
          pc.addTrack(track, stream);
        });

        try {
          stream.getAudioTracks?.().forEach((t: any) => {
            t.enabled = !isMuted;
          });
        } catch {}

        (pc as any).onicecandidate = (event: any) => {
          const candidate = event?.candidate;
          if (!candidate) return;
          try {
            socketRef.current?.emit('call_ice_candidate', {
              callId,
              targetUserId: fromUserId,
              candidate,
            });
          } catch {}
        };

        await pc.setRemoteDescription(new RTCSessionDescription(cached.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current?.emit('call_answer', {
          callId,
          targetUserId: fromUserId,
          sdp: answer,
          metadata: null,
        });
      } catch (e: any) {
        Alert.alert('Erreur', e?.message || 'Impossible de répondre à l\'appel');
        endCall();
      }
    };

    run();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    try {
      const stream = localStreamRef.current;
      stream?.getAudioTracks?.().forEach((t: any) => {
        t.enabled = !next;
      });
    } catch {}
  };

  const toggleSpeaker = () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    try {
      InCallManager.setSpeakerphoneOn(next);
    } catch {}
  };

  const statusText = useMemo(() => {
    if (uiState === 'offline') return 'Pas de connexion Internet';
    if (uiState === 'incoming') return 'Appel entrant…';
    if (uiState === 'calling') return 'Appel en cours…';
    if (uiState === 'in_call') return 'En appel';
    if (uiState === 'ended') return 'Appel terminé';
    return '';
  }, [uiState]);

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatarUri }} style={StyleSheet.absoluteFill} blurRadius={20} />
      <BlurView intensity={40} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Animated.View entering={FadeInDown.delay(200)} style={styles.avatarContainer}>
            {uiState !== 'in_call' ? (
              <Animated.View style={[styles.ring, animatedRingStyle]} />
            ) : null}
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(400)} style={styles.name}>
            {displayName}
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(500)} style={styles.status}>
            {uiState === 'in_call' ? formatTime(timer) : statusText}
          </Animated.Text>
        </View>

        <View style={styles.footer}>
          {uiState === 'incoming' ? (
            <View style={styles.answerRow}>
              <View style={styles.callControl}>
                <TouchableOpacity style={styles.hangupBtn} onPress={endCall}>
                  <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.btnLabelSecondary}>Decline</Text>
              </View>

              <View style={styles.callControl}>
                <TouchableOpacity style={styles.answerBtn} onPress={answerCall}>
                  <Ionicons name="call" size={28} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.btnLabelSecondary}>Answer</Text>
              </View>
            </View>
          ) : uiState === 'in_call' ? (
            <View style={styles.inCallActions}>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.circleBtn} onPress={toggleMute}>
                  <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="#fff" />
                  <Text style={styles.btnLabel}>{isMuted ? 'Muet' : 'Micro'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.circleBtn} onPress={toggleSpeaker}>
                  <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-low'} size={28} color="#fff" />
                  <Text style={styles.btnLabel}>{isSpeakerOn ? 'HP On' : 'HP Off'}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.hangupBtn, styles.large]} onPress={endCall}>
                <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.senderActions}>
              <TouchableOpacity style={[styles.hangupBtn, styles.large]} onPress={endCall}>
                <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.btnLabelSecondary}>Cancel</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: height * 0.15,
  },
  avatarContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
  },
  status: {
    fontSize: 16,
    marginTop: 8,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  callControl: {
    alignItems: 'center',
  },
  btnLabelSecondary: {
    color: 'rgba(255,255,255,0.75)',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  inCallActions: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 18,
    marginBottom: 26,
  },
  circleBtn: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  hangupBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  senderActions: {
    alignItems: 'center',
  },
});
