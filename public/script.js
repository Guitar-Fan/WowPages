// public/script.js

const socket = io();

const usernameInput = document.getElementById('username-input');
const joinBtn = document.getElementById('join-btn');
const usernameContainer = document.getElementById('username-container');
const mainContent = document.getElementById('main-content');
const localUsernameSpan = document.getElementById('local-username');
const onlineUsersList = document.getElementById('online-users');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const callControls = document.getElementById('call-controls');
const muteMicBtn = document.getElementById('mute-mic-btn');
const stopVideoBtn = document.getElementById('stop-video-btn');
const hangUpBtn = document.getElementById('hang-up-btn');
const incomingCallModal = document.getElementById('incoming-call-modal');
const incomingCallFrom = document.getElementById('incoming-call-from');
const acceptCallBtn = document.getElementById('accept-call-btn');
const rejectCallBtn = document.getElementById('reject-call-btn');

let localStream;
let remoteStream;
let peerConnection;
let localUsername;
let remoteUsername;
let isCallActive = false;

const stunServers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ]
};

// Event Listeners
joinBtn.addEventListener('click', joinChat);
muteMicBtn.addEventListener('click', toggleMic);
stopVideoBtn.addEventListener('click', toggleVideo);
hangUpBtn.addEventListener('click', hangUp);
acceptCallBtn.addEventListener('click', acceptCall);
rejectCallBtn.addEventListener('click', rejectCall);

// Allow enter key to join chat
usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        joinChat();
    }
});

// Functions
async function joinChat() {
    const username = usernameInput.value.trim();
    if (username) {
        localUsername = username;
        usernameContainer.style.display = 'none';
        mainContent.style.display = 'block';
        localUsernameSpan.textContent = localUsername;
        socket.emit('join', localUsername);

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480 }, 
                audio: true 
            });
            localVideo.srcObject = localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Could not access camera/microphone. Please check permissions.');
        }
    }
}

function toggleMic() {
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
        audioTracks[0].enabled = !audioTracks[0].enabled;
        muteMicBtn.textContent = audioTracks[0].enabled ? 'Mute Mic' : 'Unmute Mic';
    }
}

function toggleVideo() {
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
        videoTracks[0].enabled = !videoTracks[0].enabled;
        stopVideoBtn.textContent = videoTracks[0].enabled ? 'Stop Video' : 'Start Video';
    }
}

function hangUp() {
    if (isCallActive) {
        socket.emit('hang-up', { to: remoteUsername });
        closeCall();
    }
}

function closeCall() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    remoteVideo.srcObject = null;
    callControls.style.display = 'none';
    isCallActive = false;
    remoteUsername = null;
}

async function createPeerConnection() {
    peerConnection = new RTCPeerConnection(stunServers);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { to: remoteUsername, candidate: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        console.log('Received remote stream');
        remoteVideo.srcObject = event.streams[0];
    };

    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
    };

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
    }
}

async function callUser(username) {
    if (isCallActive) {
        alert('You are already in a call');
        return;
    }
    
    remoteUsername = username;
    await createPeerConnection();
    
    try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('offer', { to: remoteUsername, offer });
        callControls.style.display = 'block';
        isCallActive = true;
    } catch (error) {
        console.error('Error creating offer:', error);
    }
}

async function acceptCall() {
    try {
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('answer', { to: remoteUsername, answer });
        incomingCallModal.style.display = 'none';
        callControls.style.display = 'block';
        isCallActive = true;
    } catch (error) {
        console.error('Error accepting call:', error);
    }
}

// Socket.IO Event Handlers
socket.on('update-users', (users) => {
    onlineUsersList.innerHTML = '';
    users.forEach(user => {
        if (user.username !== localUsername) {
            const li = document.createElement('li');
            li.textContent = user.username;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => callUser(user.username));
            onlineUsersList.appendChild(li);
        }
    });
});

socket.on('offer', async (data) => {
    if (isCallActive) {
        socket.emit('reject-call', { to: data.from });
        return;
    }
    
    remoteUsername = data.from;
    incomingCallFrom.textContent = `Incoming call from ${remoteUsername}`;
    incomingCallModal.style.display = 'block';

    await createPeerConnection();
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    } catch (error) {
        console.error('Error setting remote description:', error);
    }
});

socket.on('answer', async (data) => {
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
        console.error('Error setting remote description for answer:', error);
    }
});

socket.on('ice-candidate', async (data) => {
    if (peerConnection && peerConnection.remoteDescription) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
            console.error('Error adding ice candidate:', error);
        }
    }
});

socket.on('call-rejected', () => {
    alert(`${remoteUsername} rejected the call.`);
    closeCall();
});

socket.on('hang-up', () => {
    closeCall();
});