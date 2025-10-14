// media.js

const apikey = window.location.pathname.split("/").slice(-1)[0]?.split("_")[0]
let userId = window.location.pathname.split("/").slice(-1)?.[0].split("_")?.[1]
let roomname;

let audio = new Audio('assets/notification/new_joined.mp3');

const socket = io({
    query: {
        apikey
    }
});

const rtc_config = {
    iceServers: [{
        "urls": ["stun:stun.l.google.com:19302",
            "stun:stun1.l.google.com:19302",
            "stun:stun2.l.google.com:19302"
        ]
    }]
}

const video_config = {
    frameRate: 18,
    width: {
        min: 480,
        ideal: 720,
        max: 1280
    },
    aspectRatio: 1.33333
};

// Pre-join elements
const videoElement = document.getElementById("localVideo");
const errorMsg = document.getElementById("errorMsg");
const joinBtn = document.getElementById("joinBtn");
const usernameInput = document.getElementById("username");
const roomnameInput = document.getElementById("roomname");
const peers = {};
let isJoined = false;
const toggleVideoBtn = document.getElementById("toggleVideoBtn");
const toggleAudioBtn = document.getElementById("toggleAudioBtn");
const videoIcon = document.getElementById("videoIcon");
const audioIcon = document.getElementById("audioIcon");
const videoLabel = document.getElementById("videoLabel");
const audioLabel = document.getElementById("audioLabel");
const randomName = "Guest" + Math.floor(Math.random() * 10000);

let urlParams
let roomNameQuery

// View containers
const prejoinView = document.getElementById("prejoinView");
const meetingView = document.getElementById("meetingView");

// Meeting elements (in meetingView)
const meetingLocalVideo = document.getElementById("meetingLocalVideo");

const meetingVideoBtn = document.getElementById("meetingVideoBtn");
const meetingAudioBtn = document.getElementById("meetingAudioBtn");
const meetingVideoIcon = document.getElementById("meetingVideoIcon");
const meetingAudioIcon = document.getElementById("meetingAudioIcon");
const meetingVideoLabel = document.getElementById("meetingVideoLabel");
const meetingAudioLabel = document.getElementById("meetingAudioLabel");
const endCallBtn = document.getElementById("endCallBtn");

let localStream = null;

/* ---------- Shared UI helpers ---------- */
function setVideoUI(enabled, hasTrack, iconEl, labelEl, btnEl) {
    if (!hasTrack) {
        if (btnEl) btnEl.disabled = true;
        if (iconEl) iconEl.className = "bi bi-camera-video-off";
        if (labelEl) labelEl.textContent = "No Camera";
        return;
    }
    if (btnEl) btnEl.disabled = false;
    if (enabled) {
        if (iconEl) iconEl.className = "bi bi-camera-video-fill";
        if (labelEl) labelEl.textContent = "Turn Video Off";
    } else {
        if (iconEl) iconEl.className = "bi bi-camera-video-off";
        if (labelEl) labelEl.textContent = "Turn Video On";
    }
}

function setAudioUI(enabled, hasTrack, iconEl, labelEl, btnEl) {
    if (!hasTrack) {
        if (btnEl) btnEl.disabled = true;
        if (iconEl) iconEl.className = "bi bi-mic-mute";
        if (labelEl) labelEl.textContent = "No Mic";
        return;
    }
    if (btnEl) btnEl.disabled = false;
    if (enabled) {
        if (iconEl) iconEl.className = "bi bi-mic-fill";
        if (labelEl) labelEl.textContent = "Mute";
    } else {
        if (iconEl) iconEl.className = "bi bi-mic-mute";
        if (labelEl) labelEl.textContent = "Unmute";
    }
}

/* ---------- Media init (pre-join) ---------- */
async function initMedia() {

    urlParams = new URLSearchParams(window.location.search);
    roomNameQuery = urlParams.get('roomname');

    if (roomNameQuery) {
        const inputEl = roomnameInput
        if (inputEl) {
            const divEl = document.createElement('div');
            divEl.textContent = roomNameQuery;
            divEl.className = 'form-control mb-3'; // Keep the styling consistent
            divEl.style.padding = '0.375rem 0.75rem'; // Optional: mimic input padding

            inputEl.parentNode.replaceChild(divEl, inputEl);
            roomname = roomNameQuery
        }
    }


    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: video_config, audio: true });
        localStream = stream;
        if (videoElement) videoElement.srcObject = stream;

        const v = stream.getVideoTracks()[0] || null;
        const a = stream.getAudioTracks()[0] || null;

        if (errorMsg) errorMsg.textContent = "";
        if (joinBtn) joinBtn.disabled = false;

        setVideoUI(!!v && v.enabled, !!v, videoIcon, videoLabel, toggleVideoBtn);
        setAudioUI(!!a && a.enabled, !!a, audioIcon, audioLabel, toggleAudioBtn);

        // startConnection()
    } catch (err) {
        console.error("Permission denied or error: ", err);
        if (errorMsg) errorMsg.textContent = "Please allow camera and microphone access to continue.";
        if (joinBtn) joinBtn.disabled = true;
        setVideoUI(false, false, videoIcon, videoLabel, toggleVideoBtn);
        setAudioUI(false, false, audioIcon, audioLabel, toggleAudioBtn);
    }
}

document.addEventListener("DOMContentLoaded", initMedia);

/* ---------- Pre-join toggles ---------- */
toggleVideoBtn?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) {
        if (errorMsg) errorMsg.textContent = "No camera track available.";
        setVideoUI(false, false, videoIcon, videoLabel, toggleVideoBtn);
        return;
    }
    track.enabled = !track.enabled;
    setVideoUI(track.enabled, true, videoIcon, videoLabel, toggleVideoBtn);
});

toggleAudioBtn?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) {
        if (errorMsg) errorMsg.textContent = "No microphone track available.";
        setAudioUI(false, false, audioIcon, audioLabel, toggleAudioBtn);
        return;
    }
    track.enabled = !track.enabled;
    setAudioUI(track.enabled, true, audioIcon, audioLabel, toggleAudioBtn);
});

/* ---------- View switching ---------- */
function showMeetingView() {
    if (prejoinView) prejoinView.classList.add("d-none");
    if (meetingView) meetingView.classList.remove("d-none");

    isJoined = true;

    if (meetingLocalVideo && localStream) {
        meetingLocalVideo.srcObject = localStream;
    }

    const v = localStream?.getVideoTracks()[0] || null;
    const a = localStream?.getAudioTracks()[0] || null;
    setVideoUI(!!v && v.enabled, !!v, meetingVideoIcon, meetingVideoLabel, meetingVideoBtn);
    setAudioUI(!!a && a.enabled, !!a, meetingAudioIcon, meetingAudioLabel, meetingAudioBtn);

}

function showPrejoinView() {
    try {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
    } catch (e) {
        console.warn("Error stopping tracks", e);
    }
    if (meetingLocalVideo) meetingLocalVideo.srcObject = null;

    // remove all remote video tag
    // if (meetingRemoteVideo) meetingRemoteVideo.srcObject = null;


    if (meetingView) meetingView.classList.add("d-none");
    if (prejoinView) prejoinView.classList.remove("d-none");

    initMedia();
}

/* ---------- Meeting controls ---------- */
meetingVideoBtn?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setVideoUI(track.enabled, true, meetingVideoIcon, meetingVideoLabel, meetingVideoBtn);
});

meetingAudioBtn?.addEventListener("click", () => {
    if (!localStream) return;
    const track = localStream.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setAudioUI(track.enabled, true, meetingAudioIcon, meetingAudioLabel, meetingAudioBtn);
});

endCallBtn?.addEventListener("click", () => {
    showPrejoinView();
    for (let p in peers) {
        peers[p].conn.close();
        delete peers[p];
    }
    socket.emit('leave_meeting');
});

/* ---------- Join / Start meeting  with rtc connection---------- */
joinBtn?.addEventListener("click", () => {
    roomname = roomnameInput ? (roomnameInput.value?.trim() || "main") : roomNameQuery;
    const username = usernameInput ? (usernameInput.value?.trim() || randomName) : randomName;
    userId = username

    if (!roomname) {
        if (errorMsg) errorMsg.textContent = "Please enter room name.";
        return;
    }

    console.log(`Joining as ${username}`);
    socket.emit('new_user', {
        userId,
        roomname
    })
    audio.play();
    showMeetingView();
    updateGrid();
    addVideoSources();
});

socket.on('user_list', ({ userList }) => {
    if (!isJoined) return;
    userList.forEach((uId) => {
        if (userId !== uId && !peers[uId]) {
            startNewPeer(uId, uId.localeCompare(userId) == 1)
            // decision of who will be the offerer
        }
    })


    // remove the user video if not  found in new user list
    Object.keys(peers).forEach(id => {
        if (!userList.includes(id)) {
            peers[id].conn.close();
            const videoToRemove = document.getElementById(`remoteVideo_${id}`);
            if (videoToRemove) videoToRemove.remove();
            delete peers[id];
            updateGrid();
            addVideoSources();
        }
    });
})

socket.on('signal', async ({ from, data }) => {
    if (!peers[from]) {
        startNewPeer(from, false);
    }

    const conn = peers[from].conn;

    if (data.offer) {
        await conn.setRemoteDescription(new RTCSessionDescription(data.offer))
        const answer = await conn.createAnswer();
        await conn.setLocalDescription(answer);
        socket.emit('signal', { to: from, from: userId, roomname, data: { answer: conn.localDescription } });
    } else if (data.answer) {
        conn.setRemoteDescription(new RTCSessionDescription(data.answer))
    } else if (data.candidate) {
        try {
            await conn.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
            console.error('Error adding received ice candidate', err);
        }
    }
})

function addVideoSources() {
    for (let p in peers) {
        const stream = peers[p].stream;
        const meetingRemoteVideo = document.getElementById(`remoteVideo_${p}`);
        if (meetingRemoteVideo && stream) {
            meetingRemoteVideo.srcObject = stream;
        }
    }
    const meetingLocalVideo = document.getElementById(`remoteVideo_you`);
    meetingLocalVideo.srcObject = localStream;
}

// Utlity functions defined here
function startNewPeer(remoteId, isOfferer = undefined) {
    if (peers[remoteId]) return;
    const conn = new RTCPeerConnection(rtc_config);
    const remoteStream = new MediaStream();
    audio.play();

    if (localStream) {
        localStream.getTracks().forEach(track => conn.addTrack(track, localStream));
    }

    conn.ontrack = (event) => {
        event.streams[0].getTracks().forEach(track => {
            if (!remoteStream.getTracks().find(t => t.id === track.id)) {
                remoteStream.addTrack(track);
            }
        });
        peers[remoteId].stream = remoteStream;
        updateGrid();
        addVideoSources();
    };

    conn.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('signal', { to: remoteId, from: userId, roomname, data: { candidate: event.candidate } });
        }
    };

    peers[remoteId] = { conn, stream: remoteStream };

    if (isOfferer) {
        conn.createOffer()
            .then(offer => conn.setLocalDescription(offer))
            .then(() => {
                socket.emit('signal', { to: remoteId, from: userId, roomname, data: { offer: conn.localDescription } })
            }).catch(err => console.log(err));
    }
}

function updateGrid() {
    const grid = document.getElementById('videoGrid');
    const users = Object.keys(peers) // +1 for local video
    count = users.length + 1
    const participants = users.map(id => ({ id, stream: peers[id].stream }));

    // Remove existing grid classes
    grid.className = 'video-grid';

    // Add appropriate grid class based on count
    if (count === 1) {
        grid.classList.add('cols-1');
    } else if (count === 2) {
        grid.classList.add('cols-2');
    } else if (count <= 4) {
        grid.classList.add('cols-2');
    } else if (count <= 9) {
        grid.classList.add('cols-3');
    } else {
        grid.classList.add('cols-4');
    }

    // Clear grid
    grid.innerHTML = '';

    // Add participants
    addParticipantVideo({ id: "you" }, grid);
    participants.forEach(participant => addParticipantVideo(participant, grid));
}

function addParticipantVideo(participant, grid) {
    const box = document.createElement('div');
    box.className = 'participant-box';
    box.innerHTML = `
                    <video
                    autoplay
                    playsinline
                    ${participant.id === "you" ? 'muted' : ''}
                    id="remoteVideo_${participant.id}"
                    class="video-elm" ></video>
                    <div class="name-tag">${participant.id}</div>
                `;
    grid.appendChild(box);
}
