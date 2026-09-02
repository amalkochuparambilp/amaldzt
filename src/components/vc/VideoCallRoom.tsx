import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Tv, 
  PhoneOff, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  ShieldCheck, 
  Activity, 
  Sparkles, 
  Hand, 
  Settings, 
  RefreshCw, 
  Users, 
  ArrowLeft,
  Sliders,
  Terminal,
  FlipHorizontal,
  SwitchCamera,
  LayoutGrid,
  Pin,
  Volume2,
  Scan
} from 'lucide-react';
import VideoTile from './VideoTile';
import CallChatPanel from './CallChatPanel';
import FloatingReactions from './FloatingReactions';
import { VCPeer, VCChatMessage, VCReaction, MediaDeviceInfoOption } from '../../types';
import { SignalingClient, RTC_CONFIG, generateRoomId, generatePeerId, formatCallDuration, SignalData } from '../../utils/webrtc';

interface VideoCallRoomProps {
  initialRoomId?: string;
  onExit?: () => void;
}

export default function VideoCallRoom({ initialRoomId, onExit }: VideoCallRoomProps) {
  // Room & Peer identity
  const [roomId, setRoomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId;
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const roomParam = searchParams.get('room');
      if (roomParam) return roomParam;
    }
    return generateRoomId();
  });

  const [peerId] = useState<string>(() => generatePeerId());
  const [displayName, setDisplayName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dzt_vc_username') || 'Amal (DZt)';
    }
    return 'Amal (DZt)';
  });

  // Call status
  const [inCall, setInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isJoining, setIsJoining] = useState(false);

  // Local media stream states
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [isLocalMirrored, setIsLocalMirrored] = useState(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Video Layout Options
  const [pinnedPeerId, setPinnedPeerId] = useState<string | null>(null);
  const [aspectFillMode, setAspectFillMode] = useState<'cover' | 'contain'>('cover');

  // Devices
  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [videoInputDevices, setVideoInputDevices] = useState<MediaDeviceInfoOption[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>('');
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>('');
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);

  // Remote peers
  const [peers, setPeers] = useState<Map<string, VCPeer>>(new Map());
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const screenTrackRef = useRef<MediaStreamTrack | null>(null);

  // Signaling & Audio Context refs
  const signalingClientRef = useRef<SignalingClient | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // In-call features
  const [messages, setMessages] = useState<VCChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reactions, setReactions] = useState<VCReaction[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Active public rooms list
  const [publicRooms, setPublicRooms] = useState<{ id: string; userCount: number }[]>([]);

  // Fetch active rooms on mount
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch('/api/meet/rooms');
        if (res.ok) {
          const data = await res.json();
          if (data.rooms) {
            setPublicRooms(data.rooms);
            return;
          }
        }
        const fallbackRes = await fetch('/api/vc/rooms');
        if (fallbackRes.ok) {
          const data = await fallbackRes.json();
          if (data.rooms) setPublicRooms(data.rooms);
        }
      } catch {
        // ignore
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 8000);
    return () => clearInterval(interval);
  }, []);

  // Synchronize roomId if initialRoomId prop changes
  useEffect(() => {
    if (initialRoomId && initialRoomId !== roomId) {
      setRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  // Load available media devices
  const refreshDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs: MediaDeviceInfoOption[] = [];
      const videoInputs: MediaDeviceInfoOption[] = [];

      devices.forEach((d) => {
        if (d.kind === 'audioinput') {
          audioInputs.push({ deviceId: d.deviceId, label: d.label || `Microphone ${audioInputs.length + 1}` });
        } else if (d.kind === 'videoinput') {
          videoInputs.push({ deviceId: d.deviceId, label: d.label || `Camera ${videoInputs.length + 1}` });
        }
      });

      setAudioInputDevices(audioInputs);
      setVideoInputDevices(videoInputs);
      if (audioInputs.length > 0 && !selectedAudioDevice) setSelectedAudioDevice(audioInputs[0].deviceId);
      if (videoInputs.length > 0 && !selectedVideoDevice) setSelectedVideoDevice(videoInputs[0].deviceId);
    } catch (err) {
      console.warn('Device enumeration error', err);
    }
  }, [selectedAudioDevice, selectedVideoDevice]);

  // Setup Audio Analysis
  const attachAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
        }
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const checkVolume = () => {
          if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            let sum = 0;
            for (let i = 0; i < data.length; i++) {
              sum += data[i];
            }
            const avg = sum / data.length;
            setLocalAudioLevel(avg);
          }
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };
        checkVolume();
      }
    } catch (e) {
      console.warn('AudioContext error', e);
    }
  };

  // Initialize Preview Media (Lobby)
  const initPreviewMedia = useCallback(async (customFacing?: 'user' | 'environment') => {
    try {
      const mode = customFacing || facingMode;
      const constraints: MediaStreamConstraints = {
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : true,
        video: selectedVideoDevice 
          ? { deviceId: { exact: selectedVideoDevice }, width: { ideal: 1280 }, height: { ideal: 720 } } 
          : { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = stream;
      setLocalStream(stream);
      attachAudioAnalyser(stream);
      await refreshDevices();
    } catch (err) {
      console.warn('Could not acquire camera/mic stream for preview:', err);
    }
  }, [selectedAudioDevice, selectedVideoDevice, facingMode, refreshDevices]);

  // Initial lobby media boot
  useEffect(() => {
    if (!inCall) {
      initPreviewMedia();
    }
    return () => {
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Call duration timer
  useEffect(() => {
    let interval: any = null;
    if (inCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [inCall]);

  // Copy share link
  const handleCopyRoomUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/meet?room=${encodeURIComponent(roomId)}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    });
  };

  // Switch Front/Back Camera (Mobile friendly)
  const handleFlipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setIsLocalMirrored(nextMode === 'user');

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: nextMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) throw new Error('No replacement camera track available');

      if (localStream) {
        const oldTrack = localStream.getVideoTracks()[0];
        if (oldTrack) localStream.removeTrack(oldTrack);
        localStream.addTrack(newVideoTrack);
        oldTrack?.stop();
      }

      // If in call, replace track in peer connections
      if (inCall) {
        peerConnectionsRef.current.forEach((pc) => {
          const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          }
        });
      }
    } catch (e) {
      // Fallback without exact constraint
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: nextMode },
          audio: false
        });
        const fallbackTrack = fallbackStream.getVideoTracks()[0];
        if (!fallbackTrack) throw new Error('No fallback camera track available');
        if (localStream) {
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) localStream.removeTrack(oldTrack);
          localStream.addTrack(fallbackTrack);
          oldTrack?.stop();
        }
        if (inCall) {
          peerConnectionsRef.current.forEach((pc) => {
            const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
            if (videoSender) {
              videoSender.replaceTrack(fallbackTrack);
            }
          });
        }
      } catch (err) {
        console.warn('Could not flip camera:', err);
      }
    }
  };

  // Create RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((targetPeerId: string, isInitiator: boolean) => {
    if (peerConnectionsRef.current.has(targetPeerId)) {
      return peerConnectionsRef.current.get(targetPeerId)!;
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetPeerId, pc);

    // Add local stream tracks to this peer connection
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote track received
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0] || new MediaStream([event.track]);
      setPeers((prev) => {
        const next = new Map<string, VCPeer>(prev);
        const existing: VCPeer = next.get(targetPeerId) || {
          id: targetPeerId,
          name: `Peer-${targetPeerId.slice(0, 4)}`,
          connectionState: 'connected'
        };
        next.set(targetPeerId, {
          id: existing.id,
          name: existing.name,
          stream: remoteStream,
          connectionState: pc.connectionState,
          isAudioMuted: existing.isAudioMuted,
          isVideoMuted: existing.isVideoMuted,
          isScreenSharing: existing.isScreenSharing,
          isHandRaised: existing.isHandRaised,
          joinedAt: existing.joinedAt
        });
        return next;
      });
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && signalingClientRef.current) {
        signalingClientRef.current.sendSignal(targetPeerId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON()
        });
      }
    };

    // Handle connection state change
    pc.onconnectionstatechange = () => {
      setPeers((prev) => {
        const next = new Map<string, VCPeer>(prev);
        const existing = next.get(targetPeerId);
        if (existing) {
          next.set(targetPeerId, {
            id: existing.id,
            name: existing.name,
            stream: existing.stream,
            connectionState: pc.connectionState,
            isAudioMuted: existing.isAudioMuted,
            isVideoMuted: existing.isVideoMuted,
            isScreenSharing: existing.isScreenSharing,
            isHandRaised: existing.isHandRaised,
            joinedAt: existing.joinedAt
          });
        }
        return next;
      });
    };

    // If this peer is the initiator, create and send Offer
    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          if (signalingClientRef.current && pc.localDescription) {
            signalingClientRef.current.sendSignal(targetPeerId, {
              type: 'offer',
              sdp: pc.localDescription
            });
          }
        })
        .catch((err) => console.error('Failed to create offer:', err));
    }

    return pc;
  }, [localStream]);

  // Handle incoming signaling message
  const handleSignalMessage = useCallback(async (senderId: string, signalData: SignalData) => {
    try {
      if (signalData.type === 'offer') {
        const pc = createPeerConnection(senderId, false);
        await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (signalingClientRef.current && pc.localDescription) {
          signalingClientRef.current.sendSignal(senderId, {
            type: 'answer',
            sdp: pc.localDescription
          });
        }
      } else if (signalData.type === 'answer') {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
        }
      } else if (signalData.type === 'ice-candidate') {
        const pc = peerConnectionsRef.current.get(senderId);
        if (pc && signalData.candidate) {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            } else {
              setTimeout(async () => {
                try {
                  if (pc.remoteDescription) {
                    await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                  }
                } catch {
                  // ignore
                }
              }, 500);
            }
          } catch (e) {
            console.warn('Failed to add ICE candidate', e);
          }
        }
      } else if (signalData.type === 'mute-status') {
        setPeers((prev) => {
          const next = new Map<string, VCPeer>(prev);
          const existing = next.get(senderId);
          if (existing) {
            next.set(senderId, {
              id: existing.id,
              name: existing.name,
              stream: existing.stream,
              connectionState: existing.connectionState,
              isAudioMuted: signalData.isAudioMuted,
              isVideoMuted: signalData.isVideoMuted,
              isScreenSharing: signalData.isScreenSharing,
              isHandRaised: signalData.isHandRaised,
              joinedAt: existing.joinedAt
            });
          }
          return next;
        });
      }
    } catch (err) {
      console.warn('Signaling message handling error', err);
    }
  }, [createPeerConnection]);

  // Join Call Action
  const handleJoinCall = async () => {
    if (!roomId.trim()) return;
    setIsJoining(true);

    try {
      localStorage.setItem('dzt_vc_username', displayName);

      // Ensure local media stream is active
      let stream = localStream;
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          localStreamRef.current = stream;
          setLocalStream(stream);
          attachAudioAnalyser(stream);
        } catch {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setIsVideoMuted(true);
            attachAudioAnalyser(stream);
          } catch {
            console.warn('Joining call without audio/video hardware stream');
          }
        }
      }

      // Initialize Signaling Client
      const client = new SignalingClient(roomId, peerId, displayName, {
        onPeerJoined: (remotePeerId, remoteDisplayName) => {
          setPeers((prev) => {
            const next = new Map(prev);
            next.set(remotePeerId, {
              id: remotePeerId,
              name: remoteDisplayName,
              connectionState: 'connecting',
              joinedAt: Date.now()
            });
            return next;
          });
          if (peerId < remotePeerId) {
            createPeerConnection(remotePeerId, true);
          }
        },

        onPeerLeft: (remotePeerId) => {
          setPeers((prev) => {
            const next = new Map(prev);
            next.delete(remotePeerId);
            return next;
          });
          if (pinnedPeerId === remotePeerId) setPinnedPeerId(null);
          const pc = peerConnectionsRef.current.get(remotePeerId);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(remotePeerId);
          }
        },

        onSignal: (senderId, signalData) => {
          handleSignalMessage(senderId, signalData);
        },

        onChatMessage: (msg) => {
          setMessages((prev) => [...prev, msg]);
          if (!isChatOpen) {
            setUnreadCount((c) => c + 1);
          }
        },

        onReaction: (senderId, senderName, emoji) => {
          const newReaction: VCReaction = {
            id: `rx-${Date.now()}-${Math.random()}`,
            senderName,
            emoji,
            x: Math.floor(20 + Math.random() * 60)
          };
          setReactions((prev) => [...prev, newReaction]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
          }, 3500);
        },

        onConnected: () => {
          setInCall(true);
          setIsJoining(false);
        },

        onError: (err) => {
          console.warn('Signaling error', err);
          setIsJoining(false);
        }
      });

      signalingClientRef.current = client;
    } catch (err) {
      console.error('Failed to join call:', err);
      setIsJoining(false);
    }
  };

  // Leave Call Action
  const handleLeaveCall = useCallback(() => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();

    if (signalingClientRef.current) {
      signalingClientRef.current.close();
      signalingClientRef.current = null;
    }

    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    setPeers(new Map());
    setInCall(false);
    setIsScreenSharing(false);
    setIsHandRaised(false);
    setPinnedPeerId(null);
  }, [isRecording]);

  // Toggle Audio Mute
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !isAudioMuted;
        audioTracks.forEach((t) => (t.enabled = isAudioMuted));
        setIsAudioMuted(nextState);
        broadcastMuteStatus(nextState, isVideoMuted, isScreenSharing, isHandRaised);
      }
    }
  };

  // Toggle Video Mute
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !isVideoMuted;
        videoTracks.forEach((t) => (t.enabled = isVideoMuted));
        setIsVideoMuted(nextState);
        broadcastMuteStatus(isAudioMuted, nextState, isScreenSharing, isHandRaised);
      }
    }
  };

  // Toggle Hand Raise
  const toggleHandRaise = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    broadcastMuteStatus(isAudioMuted, isVideoMuted, isScreenSharing, next);
  };

  // Broadcast Mute/Status changes
  const broadcastMuteStatus = (aMuted: boolean, vMuted: boolean, sShare: boolean, hRaised: boolean) => {
    if (signalingClientRef.current) {
      peers.forEach((_, pid) => {
        signalingClientRef.current?.sendSignal(pid, {
          type: 'mute-status',
          isAudioMuted: aMuted,
          isVideoMuted: vMuted,
          isScreenSharing: sShare,
          isHandRaised: hRaised
        });
      });
    }
  };

  // Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      try {
        const camStream = await navigator.mediaDevices.getUserMedia({
          video: selectedVideoDevice ? { deviceId: { exact: selectedVideoDevice } } : { facingMode }
        });
        const camTrack = camStream.getVideoTracks()[0];

        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(camTrack);
          }
        });

        if (localStream) {
          const oldVideo = localStream.getVideoTracks()[0];
          if (oldVideo) localStream.removeTrack(oldVideo);
          localStream.addTrack(camTrack);
        }

        setIsScreenSharing(false);
        setIsLocalMirrored(facingMode === 'user');
        broadcastMuteStatus(isAudioMuted, isVideoMuted, false, isHandRaised);
      } catch (e) {
        console.warn('Error reverting camera after screen share:', e);
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        screenTrackRef.current = screenTrack;

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        peerConnectionsRef.current.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        });

        if (localStream) {
          const oldVideo = localStream.getVideoTracks()[0];
          if (oldVideo) localStream.removeTrack(oldVideo);
          localStream.addTrack(screenTrack);
        }

        setIsScreenSharing(true);
        setIsLocalMirrored(false);
        setPinnedPeerId('local');
        broadcastMuteStatus(isAudioMuted, isVideoMuted, true, isHandRaised);
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  };

  // Send Chat Message
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !signalingClientRef.current) return;
    signalingClientRef.current.sendChat(text);
  };

  // Send Emoji Reaction
  const handleSendReaction = (emoji: string) => {
    if (!signalingClientRef.current) return;
    signalingClientRef.current.sendReaction(emoji);
    const selfReaction: VCReaction = {
      id: `rx-self-${Date.now()}`,
      senderName: displayName,
      emoji,
      x: 50
    };
    setReactions((prev) => [...prev, selfReaction]);
    setTimeout(() => {
      setReactions((prev) => prev.filter((r) => r.id !== selfReaction.id));
    }, 3500);
  };

  // Call Recording (Local MediaRecorder)
  const toggleRecording = () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } else {
      if (!localStream) return;
      try {
        recordedChunksRef.current = [];
        const recorder = new MediaRecorder(localStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };
        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `dzt-call-recording-${roomId}-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (e) {
        console.warn('Recording error', e);
      }
    }
  };

  // Calculate peer array
  const peerList: VCPeer[] = Array.from(peers.values());
  const totalParticipants = 1 + peerList.length;

  return (
    <div className="w-full min-h-[calc(100vh-4.5rem)] bg-[#070709] text-white flex flex-col font-sans relative overflow-hidden select-none">
      
      {/* Floating Emoji Reactions Overlay */}
      <FloatingReactions reactions={reactions} />

      {/* ========================================================================= */}
      {/* 1. LOBBY VIEW (CAMERA PREVIEW & PRE-JOIN GREEN ROOM) */}
      {/* ========================================================================= */}
      {!inCall ? (
        <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full z-10 animate-fadeIn">
          
          {/* Top Breadcrumb & Status */}
          {onExit && (
            <div className="w-full mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={onExit}
                className="flex items-center gap-2 px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/15 rounded-xs text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Ecosystem</span>
              </button>

              <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>HD WEBRTC P2P SIGNALING ONLINE</span>
              </div>
            </div>
          )}

          {/* Lobby Main Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 w-full items-start">
            
            {/* Left Column: Professional Camera Preview */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="relative w-full aspect-[4/3] sm:aspect-video bg-[#0b0b0e] rounded-sm border border-white/20 overflow-hidden shadow-2xl flex flex-col items-center justify-center group">
                
                {/* Local Preview Video */}
                <video
                  ref={(el) => {
                    if (el && localStream) el.srcObject = localStream;
                  }}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    isVideoMuted ? 'opacity-0' : 'opacity-100'
                  } ${isLocalMirrored ? 'scale-x-[-1]' : ''}`}
                />

                {/* Camera Off Avatar Overlay */}
                {isVideoMuted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d12] text-white p-6 space-y-3">
                    <div className="relative">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-3xl font-bold font-mono text-white shadow-xl">
                        {displayName.charAt(0) || 'A'}
                      </div>
                      {localAudioLevel > 15 && !isAudioMuted && (
                        <div className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
                      )}
                    </div>
                    <span className="text-xs font-mono text-white/60 uppercase tracking-widest">
                      Camera Paused
                    </span>
                  </div>
                )}

                {/* Top Quality Badge Overlay */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                  <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-xs border border-white/15 text-[11px] font-mono text-white">
                    <span className={`w-2 h-2 rounded-full ${isVideoMuted ? 'bg-red-400' : 'bg-emerald-400'}`} />
                    <span>{isVideoMuted ? 'Video Paused' : '1080p HD • Ready'}</span>
                  </div>

                  <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-xs border border-white/15 text-[10px] font-mono text-white/70">
                    <span>{facingMode === 'user' ? 'Front Cam' : 'Back Cam'}</span>
                  </div>
                </div>

                {/* Bottom Floating Control Pill */}
                <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex flex-wrap items-center justify-between gap-2 z-10">
                  
                  {/* Mic Audio Spectrum */}
                  <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-xs border border-white/15 shadow-lg">
                    <Mic className={`w-3.5 h-3.5 ${isAudioMuted ? 'text-red-400' : 'text-emerald-400'}`} />
                    <div className="flex items-end gap-0.5 h-3 w-10 sm:w-14">
                      {[1, 2, 3, 4, 5].map((b) => (
                        <div
                          key={b}
                          className={`w-1 sm:w-1.5 rounded-2xs transition-all duration-75 ${
                            isAudioMuted
                              ? 'bg-red-500/30'
                              : localAudioLevel > b * 7
                              ? 'bg-emerald-400'
                              : 'bg-white/20'
                          }`}
                          style={{ height: `${Math.min(100, (localAudioLevel / 35) * b * 20)}%` }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-white/70 uppercase hidden sm:inline">
                      {isAudioMuted ? 'Muted' : 'Mic Live'}
                    </span>
                  </div>

                  {/* Quick Toggle Controls */}
                  <div className="flex items-center gap-1.5 bg-black/85 backdrop-blur-md p-1 rounded-xs border border-white/15 shadow-lg">
                    <button
                      onClick={toggleAudio}
                      className={`min-w-[38px] min-h-[38px] p-2 rounded-xs border transition-all cursor-pointer flex items-center justify-center ${
                        isAudioMuted
                          ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                      aria-label="Toggle Microphone"
                    >
                      {isAudioMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={toggleVideo}
                      className={`min-w-[38px] min-h-[38px] p-2 rounded-xs border transition-all cursor-pointer flex items-center justify-center ${
                        isVideoMuted
                          ? 'bg-red-500 text-white border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title={isVideoMuted ? 'Start Camera' : 'Stop Camera'}
                      aria-label="Toggle Video"
                    >
                      {isVideoMuted ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>

                    {/* Mobile Flip Camera button */}
                    <button
                      onClick={handleFlipCamera}
                      className="min-w-[38px] min-h-[38px] p-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xs transition-colors cursor-pointer flex items-center justify-center"
                      title="Switch Front / Back Camera"
                      aria-label="Switch Camera"
                    >
                      <SwitchCamera className="w-4 h-4 text-cyan-300" />
                    </button>

                    {/* Mirror Toggle */}
                    <button
                      onClick={() => setIsLocalMirrored(!isLocalMirrored)}
                      className={`min-w-[38px] min-h-[38px] p-2 rounded-xs border transition-colors cursor-pointer flex items-center justify-center ${
                        isLocalMirrored ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title={isLocalMirrored ? 'Disable Mirror' : 'Enable Mirror'}
                      aria-label="Toggle Mirror"
                    >
                      <FlipHorizontal className="w-4 h-4" />
                    </button>

                    {/* Device Settings */}
                    <button
                      onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                      className={`min-w-[38px] min-h-[38px] p-2 rounded-xs border transition-colors cursor-pointer flex items-center justify-center ${
                        showDeviceSettings ? 'bg-white text-black border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                      title="Audio & Video Settings"
                      aria-label="Hardware Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Hardware Device Selection Dropdown Panel */}
              <AnimatePresence>
                {showDeviceSettings && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-[#0e0e12] border border-white/15 rounded-xs space-y-3 font-mono text-xs shadow-xl"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <span className="font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Audio & Video Hardware
                      </span>
                      <button onClick={refreshDevices} className="text-white/40 hover:text-white flex items-center gap-1 cursor-pointer">
                        <RefreshCw className="w-3 h-3" /> Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Microphone Input</label>
                        <select
                          value={selectedAudioDevice}
                          onChange={(e) => {
                            setSelectedAudioDevice(e.target.value);
                            initPreviewMedia();
                          }}
                          className="w-full bg-black border border-white/20 rounded-xs p-2 text-xs text-white outline-none focus:border-white/50"
                        >
                          {audioInputDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-white/50 uppercase mb-1">Camera Input</label>
                        <select
                          value={selectedVideoDevice}
                          onChange={(e) => {
                            setSelectedVideoDevice(e.target.value);
                            initPreviewMedia();
                          }}
                          className="w-full bg-black border border-white/20 rounded-xs p-2 text-xs text-white outline-none focus:border-white/50"
                        >
                          {videoInputDevices.map((d) => (
                            <option key={d.deviceId} value={d.deviceId}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Column: Room Details & Join Controller */}
            <div className="lg:col-span-5 bg-[#0a0a0d] border border-white/15 rounded-sm p-5 sm:p-7 space-y-5 shadow-2xl font-mono">
              
              {/* Header */}
              <div className="space-y-1 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-bold uppercase tracking-widest">
                  <Sparkles className="w-4 h-4" />
                  <span>DZt Meet • Video Hub</span>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">
                  P2P Video Conference
                </h2>
                <p className="text-xs text-white/50 font-sans">
                  Direct peer-to-peer WebRTC encrypted video with instant mesh signaling, screen broadcasting, and real-time chat.
                </p>
              </div>

              {/* Callsign / Display Name Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] text-white/60 uppercase tracking-widest">
                  Your Callsign / Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name..."
                  className="w-full min-h-[42px] bg-black/60 border border-white/20 rounded-xs px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Room ID Input & Random Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] text-white/60 uppercase tracking-widest">
                    Target Room ID
                  </label>
                  <button
                    onClick={() => setRoomId(generateRoomId())}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 uppercase cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> New Room
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                    placeholder="e.g. dzt-mesh-492"
                    className="flex-1 min-h-[42px] bg-black/60 border border-white/20 rounded-xs px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    onClick={handleCopyRoomUrl}
                    className="min-h-[42px] px-3.5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xs text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Copy Shareable Meet URL"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
                    <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Shareable Room URL Display */}
              <div className="bg-black/50 border border-white/10 p-3 rounded-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest block">Direct Meet URL:</span>
                  <span className="text-[9px] text-emerald-400 font-mono">1-Click Join</span>
                </div>
                <div className="text-[11px] text-cyan-300 font-mono truncate select-all">
                  {typeof window !== 'undefined' ? `${window.location.origin}/meet?room=${encodeURIComponent(roomId)}` : `/meet?room=${roomId}`}
                </div>
              </div>

              {/* Quick Room Presets */}
              <div className="space-y-1.5">
                <span className="text-[9px] text-white/40 uppercase tracking-widest block">Quick Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {['dzt-collab-101', 'jnias-lab-202', 'amal-mesh-707'].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setRoomId(preset)}
                      className={`px-2.5 py-1 text-[10px] font-mono rounded-xs border transition-all cursor-pointer ${
                        roomId === preset
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-white/5 text-white/60 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Join Button */}
              <button
                id="btn-join-vc-room"
                onClick={handleJoinCall}
                disabled={isJoining || !roomId.trim() || !displayName.trim()}
                className="w-full min-h-[46px] py-3.5 bg-white text-black font-bold font-mono text-xs sm:text-sm uppercase tracking-widest rounded-xs hover:bg-white/90 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isJoining ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Connecting P2P Mesh...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    <span>Enter Room ({roomId})</span>
                  </>
                )}
              </button>

              {/* End-to-End Security Note */}
              <div className="flex items-center justify-between text-[10px] text-white/40 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> WebRTC DTLS / SRTP E2EE
                </span>
                <span>MESH NODE ACTIVE</span>
              </div>

            </div>

          </div>

          {/* Active Public Rooms Explorer */}
          {publicRooms.length > 0 && (
            <div className="w-full mt-8 p-5 bg-[#0a0a0d] border border-white/15 rounded-sm space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-white/60 uppercase">
                <span className="flex items-center gap-2 font-bold text-white">
                  <Users className="w-4 h-4 text-cyan-400" /> Active Ecosystem Channels
                </span>
                <span>{publicRooms.length} Live</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {publicRooms.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setRoomId(r.id)}
                    className="p-3 bg-white/5 border border-white/10 hover:border-white/30 rounded-xs transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div>
                      <span className="text-xs text-white font-bold group-hover:text-cyan-300 transition-colors">
                        {r.id}
                      </span>
                      <span className="text-[10px] text-white/40 block">P2P Channel</span>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-xs border border-emerald-500/30">
                      {r.userCount} {r.userCount === 1 ? 'peer' : 'peers'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        /* ========================================================================= */
        /* 2. ACTIVE CALL INTERFACE (PROFESSIONAL RESPONSIVE VIDEO GRID + HUD) */
        /* ========================================================================= */
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#050507]">
          
          {/* In-Call Top HUD Bar */}
          <header className="h-14 px-3 sm:px-6 bg-black/90 border-b border-white/15 flex items-center justify-between z-20 font-mono text-xs select-none backdrop-blur-md">
            
            {/* Room Identifier & Copy Link */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 bg-white/10 px-2.5 sm:px-3 py-1 rounded-xs border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold text-white uppercase text-[11px] sm:text-xs truncate max-w-[110px] sm:max-w-[200px]">
                  {roomId}
                </span>
              </div>

              <button
                onClick={handleCopyRoomUrl}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/15 border border-white/10 rounded-xs text-[11px] text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Copy Room Link to Invite Peers"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/60" />}
                <span>{copiedLink ? 'Link Copied!' : 'Copy Invite URL'}</span>
              </button>
            </div>

            {/* Middle: Call Duration Timer & Security Badge */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 text-white font-bold bg-black/60 px-2.5 sm:px-3 py-1 rounded-xs border border-white/10">
                <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>{formatCallDuration(callDuration)}</span>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>E2EE SECURE</span>
              </div>
            </div>

            {/* Right: Peers Count & Layout / Telemetry Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-white/80 bg-white/5 px-2.5 py-1 rounded-xs border border-white/10 text-[11px]">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>{totalParticipants}</span>
              </div>

              {/* Aspect Fill Toggle */}
              <button
                onClick={() => setAspectFillMode(aspectFillMode === 'cover' ? 'contain' : 'cover')}
                className={`p-1.5 rounded-xs border transition-colors cursor-pointer hidden sm:block ${
                  aspectFillMode === 'contain' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
                title={aspectFillMode === 'contain' ? 'Cover/Crop Tiles' : 'Contain/Fit Tiles'}
              >
                <Scan className="w-4 h-4" />
              </button>

              {/* Telemetry Diagnostics */}
              <button
                onClick={() => setShowDiagnostics(!showDiagnostics)}
                className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
                  showDiagnostics ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                }`}
                title="Toggle WebRTC Telemetry Stats"
              >
                <Terminal className="w-4 h-4" />
              </button>
            </div>

          </header>

          {/* Main Workspace Frame: Responsive Video Grid + Chat Drawer */}
          <div className="flex-1 flex overflow-hidden relative">
            
            {/* Video Streams Container Area */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto flex flex-col justify-center items-center">
              
              {/* SPOTLIGHT MODE: If a participant is pinned or screen sharing */}
              {pinnedPeerId ? (
                <div className="w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-3">
                  
                  {/* Primary Spotlight Tile */}
                  <div className="flex-1 h-full min-h-[300px] lg:min-h-0">
                    {pinnedPeerId === 'local' ? (
                      <VideoTile
                        stream={localStream}
                        isLocal={true}
                        displayName={displayName}
                        isAudioMuted={isAudioMuted}
                        isVideoMuted={isVideoMuted}
                        isScreenSharing={isScreenSharing}
                        isHandRaised={isHandRaised}
                        audioLevel={localAudioLevel}
                        isSpeaking={localAudioLevel > 15 && !isAudioMuted}
                        isPinned={true}
                        onTogglePin={() => setPinnedPeerId(null)}
                        aspectFill={aspectFillMode}
                        onToggleAspectFill={() => setAspectFillMode(aspectFillMode === 'cover' ? 'contain' : 'cover')}
                      />
                    ) : (
                      (() => {
                        const targetPeer = peers.get(pinnedPeerId);
                        if (!targetPeer) return null;
                        return (
                          <VideoTile
                            key={targetPeer.id}
                            peer={targetPeer}
                            stream={targetPeer.stream}
                            isLocal={false}
                            displayName={targetPeer.name}
                            isAudioMuted={targetPeer.isAudioMuted}
                            isVideoMuted={targetPeer.isVideoMuted}
                            isScreenSharing={targetPeer.isScreenSharing}
                            isHandRaised={targetPeer.isHandRaised}
                            connectionState={targetPeer.connectionState}
                            isPinned={true}
                            onTogglePin={() => setPinnedPeerId(null)}
                            aspectFill={aspectFillMode}
                            onToggleAspectFill={() => setAspectFillMode(aspectFillMode === 'cover' ? 'contain' : 'cover')}
                          />
                        );
                      })()
                    )}
                  </div>

                  {/* Secondary Filmstrip (Horizontal on mobile, Vertical on desktop) */}
                  <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:w-64 h-36 lg:h-full flex-shrink-0">
                    {pinnedPeerId !== 'local' && (
                      <div className="w-48 lg:w-full h-full lg:h-36 flex-shrink-0">
                        <VideoTile
                          stream={localStream}
                          isLocal={true}
                          displayName={displayName}
                          isAudioMuted={isAudioMuted}
                          isVideoMuted={isVideoMuted}
                          isScreenSharing={isScreenSharing}
                          isHandRaised={isHandRaised}
                          audioLevel={localAudioLevel}
                          isSpeaking={localAudioLevel > 15 && !isAudioMuted}
                          onTogglePin={() => setPinnedPeerId('local')}
                          aspectFill="cover"
                        />
                      </div>
                    )}

                    {peerList
                      .filter((p) => p.id !== pinnedPeerId)
                      .map((peer) => (
                        <div key={peer.id} className="w-48 lg:w-full h-full lg:h-36 flex-shrink-0">
                          <VideoTile
                            peer={peer}
                            stream={peer.stream}
                            isLocal={false}
                            displayName={peer.name}
                            isAudioMuted={peer.isAudioMuted}
                            isVideoMuted={peer.isVideoMuted}
                            isScreenSharing={peer.isScreenSharing}
                            isHandRaised={peer.isHandRaised}
                            connectionState={peer.connectionState}
                            onTogglePin={() => setPinnedPeerId(peer.id)}
                            aspectFill="cover"
                          />
                        </div>
                      ))}
                  </div>

                </div>
              ) : (
                /* RESPONSIVE DYNAMIC GRID MODE (Mobile & Desktop) */
                <div
                  className={`w-full max-w-7xl mx-auto h-full grid gap-2.5 sm:gap-4 items-center justify-center ${
                    totalParticipants === 1
                      ? 'grid-cols-1 max-w-3xl aspect-[4/3] sm:aspect-video'
                      : totalParticipants === 2
                      ? 'grid-cols-1 md:grid-cols-2 max-w-5xl'
                      : totalParticipants === 3
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl'
                      : totalParticipants === 4
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 max-w-5xl'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {/* Local Video Tile */}
                  <VideoTile
                    stream={localStream}
                    isLocal={true}
                    displayName={displayName}
                    isAudioMuted={isAudioMuted}
                    isVideoMuted={isVideoMuted}
                    isScreenSharing={isScreenSharing}
                    isHandRaised={isHandRaised}
                    audioLevel={localAudioLevel}
                    isSpeaking={localAudioLevel > 15 && !isAudioMuted}
                    onTogglePin={() => setPinnedPeerId('local')}
                    aspectFill={aspectFillMode}
                    onToggleAspectFill={() => setAspectFillMode(aspectFillMode === 'cover' ? 'contain' : 'cover')}
                  />

                  {/* Remote Peers Video Tiles */}
                  {peerList.map((peer) => (
                    <VideoTile
                      key={peer.id}
                      peer={peer}
                      stream={peer.stream}
                      isLocal={false}
                      displayName={peer.name}
                      isAudioMuted={peer.isAudioMuted}
                      isVideoMuted={peer.isVideoMuted}
                      isScreenSharing={peer.isScreenSharing}
                      isHandRaised={peer.isHandRaised}
                      connectionState={peer.connectionState}
                      onTogglePin={() => setPinnedPeerId(peer.id)}
                      aspectFill={aspectFillMode}
                      onToggleAspectFill={() => setAspectFillMode(aspectFillMode === 'cover' ? 'contain' : 'cover')}
                    />
                  ))}
                </div>
              )}

              {/* Waiting for peer banner when alone */}
              {peerList.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3.5 sm:p-4 bg-[#0e0e12]/95 backdrop-blur-md border border-white/15 rounded-xs max-w-md w-full text-center space-y-2 font-mono text-xs shadow-xl"
                >
                  <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold uppercase">
                    <Share2 className="w-4 h-4 animate-bounce" />
                    <span>Waiting for peers to join room</span>
                  </div>
                  <p className="text-white/60 font-sans text-xs">
                    Share this room link with your peer or test by opening another tab.
                  </p>
                  <button
                    onClick={handleCopyRoomUrl}
                    className="w-full min-h-[38px] py-2 bg-white text-black font-bold uppercase tracking-wider rounded-2xs hover:bg-white/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link Copied to Clipboard' : 'Copy Room URL'}</span>
                  </button>
                </motion.div>
              )}

            </div>

            {/* In-Call Chat Drawer */}
            <AnimatePresence>
              {isChatOpen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="absolute sm:relative right-0 top-0 bottom-0 z-30 shadow-2xl"
                >
                  <CallChatPanel
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    onSendReaction={handleSendReaction}
                    onClose={() => setIsChatOpen(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Diagnostics Telemetry Overlay HUD */}
          <AnimatePresence>
            {showDiagnostics && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-16 right-4 z-40 w-80 bg-black/95 border border-cyan-500/40 rounded-xs p-4 font-mono text-xs shadow-2xl space-y-3 backdrop-blur-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-cyan-400">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" /> WebRTC Node Diagnostics
                  </span>
                  <button onClick={() => setShowDiagnostics(false)} className="text-white/40 hover:text-white cursor-pointer">✕</button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between text-white/60">
                    <span>Local Peer ID:</span>
                    <span className="text-white font-mono">{peerId.slice(0, 10)}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Active Mesh Peers:</span>
                    <span className="text-emerald-400 font-bold">{peerList.length}</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Signaling Mode:</span>
                    <span className="text-white">WebSocket / Direct Relay</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Codec Profile:</span>
                    <span className="text-white">VP9 / Opus DTLS-SRTP</span>
                  </div>
                  <div className="flex justify-between text-white/60">
                    <span>Audio Level:</span>
                    <span className="text-cyan-300">{Math.round(localAudioLevel)} dB</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* In-Call Bottom Control Floating Dock (Responsive for Mobile & Desktop) */}
          {/* ========================================================================= */}
          <footer className="min-h-[72px] bg-[#09090c]/95 border-t border-white/15 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-center sm:justify-between z-30 select-none backdrop-blur-xl gap-2">
            
            {/* Left Tools (Recording, Reactions) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={toggleRecording}
                className={`px-3 py-2 rounded-xs border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRecording
                    ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse font-bold'
                    : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                }`}
                title={isRecording ? 'Stop Recording and Save' : 'Record Video Call'}
              >
                <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-white/40'}`} />
                <span className="uppercase">{isRecording ? 'Recording' : 'Record'}</span>
              </button>

              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xs p-1">
                {['👏', '🔥', '🚀', '❤️', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendReaction(emoji)}
                    className="px-1.5 py-1 text-sm hover:scale-125 transition-transform cursor-pointer"
                    title={`Send ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Core Call Action Controls */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mic Toggle */}
              <button
                id="btn-toggle-mic"
                onClick={toggleAudio}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isAudioMuted
                    ? 'bg-red-500 text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title={isAudioMuted ? 'Unmute Audio (Mic)' : 'Mute Audio (Mic)'}
                aria-label="Toggle Microphone"
              >
                {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Toggle */}
              <button
                id="btn-toggle-video"
                onClick={toggleVideo}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isVideoMuted
                    ? 'bg-red-500 text-white border-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title={isVideoMuted ? 'Start Camera' : 'Stop Camera'}
                aria-label="Toggle Video"
              >
                {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              {/* Mobile Camera Flip Button */}
              <button
                onClick={handleFlipCamera}
                className="min-w-[44px] min-h-[44px] p-3 rounded-full border border-white/20 bg-white/10 hover:bg-white/20 text-cyan-300 transition-all cursor-pointer flex items-center justify-center sm:hidden"
                title="Switch Front / Back Camera"
                aria-label="Switch Camera"
              >
                <SwitchCamera className="w-5 h-5" />
              </button>

              {/* Screen Share Toggle */}
              <button
                id="btn-toggle-screen"
                onClick={toggleScreenShare}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all cursor-pointer hidden sm:flex items-center justify-center ${
                  isScreenSharing
                    ? 'bg-cyan-500 text-black font-bold border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                aria-label="Toggle Screen Share"
              >
                <Tv className="w-5 h-5" />
              </button>

              {/* Raise Hand Toggle */}
              <button
                id="btn-toggle-hand"
                onClick={toggleHandRaise}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all cursor-pointer flex items-center justify-center ${
                  isHandRaised
                    ? 'bg-amber-400 text-black font-bold border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                aria-label="Toggle Hand Raise"
              >
                <Hand className="w-5 h-5" />
              </button>

              {/* In-Call Chat Drawer Toggle */}
              <button
                id="btn-toggle-chat"
                onClick={() => {
                  setIsChatOpen(!isChatOpen);
                  if (!isChatOpen) setUnreadCount(0);
                }}
                className={`min-w-[44px] min-h-[44px] p-3 rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                  isChatOpen
                    ? 'bg-white text-black border-white'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
                title="Open Transmission Chat"
                aria-label="Toggle Chat"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadCount > 0 && !isChatOpen && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* End / Leave Call Button */}
              <button
                id="btn-leave-call"
                onClick={handleLeaveCall}
                className="min-h-[44px] px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ml-1"
                title="Disconnect from Room"
              >
                <PhoneOff className="w-4 h-4" />
                <span>Leave</span>
              </button>
            </div>

            {/* Right Tools (Invite & Return) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleCopyRoomUrl}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xs text-xs font-mono text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Copy Room Link to Invite"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white/70" />}
                <span className="uppercase">{copiedLink ? 'Copied' : 'Invite'}</span>
              </button>
            </div>

          </footer>

        </div>
      )}

    </div>
  );
}
