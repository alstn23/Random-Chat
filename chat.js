document.addEventListener('DOMContentLoaded', () => {
    const navEntries = performance.getEntriesByType("navigation");
    if (navEntries.length > 0 && (navEntries[0].type === "reload" || navEntries[0].type === "back_forward")) {
        location.replace('main');
        return;
    }

    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const cancelMatchBtn = document.getElementById('cancelMatchBtn');
    const chatBox = document.querySelector('.chat-box');
    const loadingScreen = document.getElementById('loadingScreen');
    const blockBtn = document.getElementById('blockBtn');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const exitChatBtn = document.getElementById('exitChatBtn') || document.querySelector('.back-btn');

    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    const imgUploadBtn = document.getElementById('imgUploadBtn');
    const imageInput = document.getElementById('imageInput');
    const imageConfirmModal = document.getElementById('imageConfirmModal');
    const previewImage = document.getElementById('previewImage');
    const sendImageBtn = document.getElementById('sendImageBtn');
    const cancelImageBtn = document.getElementById('cancelImageBtn');
    
    const friendRequestModal = document.getElementById('friendRequestModal');
    const acceptFriendBtn = document.getElementById('acceptFriendBtn');
    const declineFriendBtn = document.getElementById('declineFriendBtn');

    const typingIndicator = document.getElementById('typingIndicator');
    let typingTimeout = null;
    let isTyping = false;

    const socket = io();
    let matchStartTime = null;
    let blockedUsers = JSON.parse(sessionStorage.getItem('blockedUsers')) || [];
    let currentPartnerSocketId = null;
    let selectedImageData = null;
    let imageSendCount = 3;

    let myGender = localStorage.getItem('myGender') || 'U';
    let targetGender = localStorage.getItem('targetGender') || 'A';

    let afkTimer = null;
    let myFirstMsgSent = false;
    let partnerFirstMsgReceived = false;
    let isDisconnected = false; 

    let myUserId = localStorage.getItem('myUserId');
    let friendRequestTimer = null;

    imgUploadBtn.innerHTML = `이미지 첨부하기<br>( ${imageSendCount}회 )`;

    socket.emit('registerUser');

    socket.on('globalImageLock', (data) => {
        if (data.locked) {
            attachBtn.classList.add('hidden');
            attachMenu.classList.add('hidden');
        } else {
            attachBtn.classList.remove('hidden');
        }
    });

    socket.on('authFailed', () => {
        alert('인증 정보가 유효하지 않습니다. 새로운 세션을 시작합니다.');
        localStorage.removeItem('myUserId');
        location.replace('/');
    });

    socket.on('disconnect', () => {
        alert('서버와의 연결이 끊어졌습니다.');
        location.replace('main');
    });

    socket.emit('requestMatch', { 
        blockedList: blockedUsers, 
        userId: myUserId,
        myGender: myGender,
        targetGender: targetGender
    });

    window.addEventListener('pagehide', () => {
        socket.emit('leaveRoom');
    });

    if (exitChatBtn) {
        exitChatBtn.addEventListener('click', () => {
            if (!currentPartnerSocketId || isDisconnected) {
                location.replace('main');
            } else {
                socket.emit('leaveRoom');
                showDisconnectMessage('채팅을 종료했습니다.');
            }
        });
    }

    function trimChatBox() {
        while (chatBox.children.length > 50) {
            chatBox.removeChild(chatBox.firstChild);
        }
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (text === '') return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message sent';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble';
        bubbleDiv.textContent = text;
        messageDiv.appendChild(bubbleDiv);
        chatBox.appendChild(messageDiv);
        trimChatBox();

        socket.emit('sendMessage', text);

        myFirstMsgSent = true;
        if (myFirstMsgSent && partnerFirstMsgReceived) clearTimeout(afkTimer);

        clearTimeout(typingTimeout);
        isTyping = false;
        socket.emit('stopTyping');

        messageInput.value = '';
        messageInput.focus();
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function addSystemMessage(htmlText) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message system';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble';
        bubbleDiv.innerHTML = htmlText;
        messageDiv.appendChild(bubbleDiv);
        chatBox.appendChild(messageDiv);
        trimChatBox();
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    window.rematch = function() {
        isDisconnected = false;
        currentPartnerSocketId = null;
        currentPartnerUserId = null;
        clearTimeout(afkTimer);
        chatBox.innerHTML = '';
        messageInput.disabled = false;
        sendBtn.disabled = false;
        blockBtn.classList.add('hidden');
        addFriendBtn.classList.add('hidden');
        imageSendCount = 3;
        imgUploadBtn.innerHTML = `이미지 첨부하기<br>( ${imageSendCount}회 )`;
        socket.emit('requestMatch', { 
            blockedList: blockedUsers, 
            userId: myUserId,
            myGender: myGender,
            targetGender: targetGender
        });
    };

    function showDisconnectMessage(reason) {
        if (isDisconnected) return;
        isDisconnected = true;
        clearTimeout(afkTimer);
        
        typingIndicator.classList.add('hidden');
        typingIndicator.innerHTML = '';
        
        const endTime = new Date();
        let durationText = '알 수 없음';
        
        if (matchStartTime) {
            const diff = Math.floor((endTime - matchStartTime) / 1000);
            const minutes = Math.floor(diff / 60);
            const seconds = diff % 60;
            durationText = `${minutes}분 ${seconds}초`;
        }

        addSystemMessage(`
            채팅이 종료되었습니다.<br>
            종료 사유: ${reason}<br>
            진행 시간: ${durationText}
            <div class="system-btn-group">
                <button class="sys-btn btn-rematch" onclick="rematch()">다시매칭하기</button>
                <button class="sys-btn btn-exit" onclick="location.replace('main')">나가기</button>
            </div>
        `);

        messageInput.disabled = true;
        sendBtn.disabled = true;
        blockBtn.classList.add('hidden');
        addFriendBtn.classList.add('hidden');
    }

    attachBtn.addEventListener('click', () => {
        attachMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!attachBtn.contains(e.target) && !attachMenu.contains(e.target)) {
            attachMenu.classList.add('hidden');
        }
    });

    imgUploadBtn.addEventListener('click', () => {
        attachMenu.classList.add('hidden');
        if (imageSendCount <= 0) {
            alert('이미지는 최대 3번까지만 보낼 수 있습니다.');
            return;
        }
        imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const max_size = 1024;
                
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }
                
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                
                    selectedImageData = canvas.toDataURL('image/jpeg', 0.8);
                    previewImage.src = selectedImageData;
                    imageConfirmModal.classList.remove('hidden');
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
        imageInput.value = '';
    });

    cancelImageBtn.addEventListener('click', () => {
        imageConfirmModal.classList.add('hidden');
        selectedImageData = null;
    });

    sendImageBtn.addEventListener('click', async () => {
        if (selectedImageData) {
            if (imageSendCount <= 0) return;
            
            imageSendCount--;
            imgUploadBtn.innerHTML = `이미지 첨부하기<br>( ${imageSendCount}회 )`;

            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'bubble img-bubble';
            const imgElement = document.createElement('img');
            imgElement.src = selectedImageData;
            imgElement.className = 'chat-image';
            
            bubbleDiv.appendChild(imgElement);
            messageDiv.appendChild(bubbleDiv);
            chatBox.appendChild(messageDiv);
            trimChatBox();

            imageConfirmModal.classList.add('hidden');
            chatBox.scrollTop = chatBox.scrollHeight;

            try {
                const uploadData = await window.uploadImageFromClient(selectedImageData, 'chat', myUserId, socket);
                
                socket.emit('sendImage', uploadData);
            } catch (error) {
                console.error(error);
                alert('이미지 전송에 실패했습니다.');
            }
            
            myFirstMsgSent = true;
            if (myFirstMsgSent && partnerFirstMsgReceived) clearTimeout(afkTimer);

            selectedImageData = null;
        }
    });

    socket.on('receiveImage', (imageData) => {
        partnerFirstMsgReceived = true;
        if (myFirstMsgSent && partnerFirstMsgReceived) clearTimeout(afkTimer);
        if (localStorage.getItem('hideImages') === 'true') return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message received';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble img-bubble';

        const wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'image-wrapper';

        const imgElement = document.createElement('img');
        imgElement.src = imageData;
        imgElement.className = 'chat-image blurred';

        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'image-overlay';
        
        const warningText = document.createElement('p');
        warningText.textContent = '주의가 필요한 이미지입니다.';
        
        const viewBtn = document.createElement('button');
        viewBtn.className = 'unblur-btn';
        viewBtn.textContent = '확인하기';
        
        viewBtn.addEventListener('click', () => {
            imgElement.classList.remove('blurred');
            overlayDiv.style.display = 'none';
        });

        overlayDiv.appendChild(warningText);
        overlayDiv.appendChild(viewBtn);
        
        wrapperDiv.appendChild(imgElement);
        wrapperDiv.appendChild(overlayDiv);

        bubbleDiv.appendChild(wrapperDiv);
        messageDiv.appendChild(bubbleDiv);
        chatBox.appendChild(messageDiv);
        trimChatBox();
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    sendBtn.addEventListener('mousedown', (e) => e.preventDefault());
    sendBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        sendMessage();
    }, { passive: false });
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sendMessage();
    });

    messageInput.addEventListener('input', () => {
        if (!isTyping) {
            isTyping = true;
            socket.emit('typing');
        }
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            socket.emit('stopTyping');
        }, 1500);
    });

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    messageInput.addEventListener('focus', () => {
        setTimeout(() => {
            chatBox.scrollTop = chatBox.scrollHeight;
        }, 300);
    });

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            chatBox.scrollTop = chatBox.scrollHeight;
        });
    }

    blockBtn.addEventListener('click', () => {
        if (confirm('상대방을 차단하시겠습니까? 더 이상 이 상대와 매칭되지 않으며 대화가 종료됩니다.')) {
            if (currentPartnerSocketId) {
                blockedUsers.push(currentPartnerSocketId);
                sessionStorage.setItem('blockedUsers', JSON.stringify(blockedUsers));
            }
            socket.emit('leaveRoom');
            showDisconnectMessage('상대방을 차단했습니다.');
        }
    });

    addFriendBtn.addEventListener('click', () => {
        socket.emit('sendFriendRequest');
        addSystemMessage('상대방에게 친구 요청을 보냈습니다.');
        addFriendBtn.disabled = true;
    });

    acceptFriendBtn.addEventListener('click', () => {
        clearTimeout(friendRequestTimer);
        friendRequestModal.classList.add('hidden');
        socket.emit('friendRequestAccepted');
        addSystemMessage('친구 요청을 수락했습니다. 서로의 친구 목록에 추가되었습니다.');
        
        socket.emit('addFriendDB');
        
        addFriendBtn.classList.add('hidden');
    });

    declineFriendBtn.addEventListener('click', () => {
        clearTimeout(friendRequestTimer);
        friendRequestModal.classList.add('hidden');
        socket.emit('friendRequestDeclined');
        addSystemMessage('친구 요청을 거절했습니다.');
    });

    declineFriendBtn.addEventListener('click', () => {
        friendRequestModal.classList.add('hidden');
        socket.emit('friendRequestDeclined');
        addSystemMessage('친구 요청을 거절했습니다.');
    });

    cancelMatchBtn.addEventListener('click', () => {
        location.replace('main');
    });

    socket.on('waiting', () => {
        loadingScreen.classList.remove('hidden');
        blockBtn.classList.add('hidden');
        addFriendBtn.classList.add('hidden');
    });

    socket.on('matched', (data) => {
        isDisconnected = false; 
        loadingScreen.classList.add('hidden');
        blockBtn.classList.remove('hidden');
        addFriendBtn.classList.remove('hidden');
        addFriendBtn.disabled = false;
        
        chatBox.innerHTML = '';
        matchStartTime = new Date();
        currentPartnerSocketId = data.partnerSocketId;
        
        messageInput.disabled = false;
        sendBtn.disabled = false;
        addSystemMessage('채팅이 시작되었습니다.');

        myFirstMsgSent = false;
        partnerFirstMsgReceived = false;
        clearTimeout(afkTimer);
        
        afkTimer = setTimeout(() => {
            if (!myFirstMsgSent || !partnerFirstMsgReceived) {
                socket.emit('leaveRoom');
                showDisconnectMessage('20초 자리비움 종료');
            }
        }, 20000);
    });

    socket.on('receiveFriendRequest', () => {
        friendRequestModal.classList.remove('hidden');
        friendRequestTimer = setTimeout(() => {
            declineFriendBtn.click();
        }, 10000);
    });

    socket.on('friendRequestSuccess', () => {
        addSystemMessage('상대방이 친구 요청을 수락했습니다!');
        
        addFriendBtn.classList.add('hidden');
    });

    socket.on('friendRequestFailed', () => {
        addSystemMessage('상대방이 친구 요청을 거절했습니다.');
        addFriendBtn.disabled = false;
    });

    socket.on('receiveMessage', (message) => {
        partnerFirstMsgReceived = true;
        if (myFirstMsgSent && partnerFirstMsgReceived) clearTimeout(afkTimer);

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message received';
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble';
        bubbleDiv.textContent = message;
        messageDiv.appendChild(bubbleDiv);
        chatBox.appendChild(messageDiv);
        trimChatBox();
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on('systemMessage', (message) => {
        addSystemMessage(message);
    });

    socket.on('partnerTyping', () => {
        typingIndicator.innerHTML = '';
        const text = "입력중...";
        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${i * 0.05}s`;
            typingIndicator.appendChild(span);
        });
        
        typingIndicator.classList.remove('hidden');
        chatBox.scrollTop = chatBox.scrollHeight;
    });

    socket.on('partnerStopTyping', () => {
        typingIndicator.classList.add('hidden');
    });

    socket.on('peerDisconnected', () => {
        showDisconnectMessage('상대방 퇴장');
    });
});