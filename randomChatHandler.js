module.exports = (io, socket, waitingUsers, escapeHtml, trackAndLimitImages) => {
    socket.on('requestMatch', (data) => {
        if (!socket.isDbAuthenticated || !socket.userId) return;
        const now = Date.now();
        
        if (socket.rateLimitTracker) {
            if (!socket.rateLimitTracker.matchTimestamps) socket.rateLimitTracker.matchTimestamps = [];
            socket.rateLimitTracker.matchTimestamps.push(now);
            socket.rateLimitTracker.matchTimestamps = socket.rateLimitTracker.matchTimestamps.filter(t => now - t <= 5000);
            if (socket.rateLimitTracker.matchTimestamps.length > 5) {
                socket.emit('systemMessage', '[시스템] 매칭 요청이 너무 빠릅니다. 잠시 후 다시 시도해주세요.');
                return;
            }
        }
        
        socket.friendRequestCount = 0;
        socket.blockedUsers = data.blockedList || [];
        socket.myGender = data.myGender || 'U';
        socket.targetGender = data.targetGender || 'A';
        
        if (socket.roomName) {
            socket.leave(socket.roomName);
            socket.roomName = null;
        }

        const waitIdx = waitingUsers.indexOf(socket);
        if (waitIdx !== -1) waitingUsers.splice(waitIdx, 1);

        let matchIndex = waitingUsers.findIndex(u => {
            if (socket.blockedUsers.includes(u.id) || u.blockedUsers.includes(socket.id)) return false;
            if (u.userId === socket.userId) return false;

            if (socket.friendList && socket.friendList.includes(u.userId)) return false;
            if (u.friendList && u.friendList.includes(socket.userId)) return false;

            const isMyTargetMatch = (socket.targetGender === 'A') || (socket.targetGender === u.myGender);
            const isUTargetMatch = (u.targetGender === 'A') || (u.targetGender === socket.myGender);

            return isMyTargetMatch && isUTargetMatch;
        });

        if (matchIndex !== -1) {
            let partner = waitingUsers.splice(matchIndex, 1)[0];
            const roomName = `room_${Date.now()}`;
            
            socket.join(roomName);
            partner.join(roomName);
            
            socket.roomName = roomName;
            partner.roomName = roomName;

            socket.currentPartnerUserId = partner.userId;
            partner.currentPartnerUserId = socket.userId;

            socket.emit('matched', { partnerSocketId: partner.id });
            partner.emit('matched', { partnerSocketId: socket.id });
        } else {
            waitingUsers.push(socket);
            socket.emit('waiting');
        }
    });

    socket.on('sendMessage', (message) => {
        if (typeof message !== 'string' || message.length > 1000) return;
        
        if (socket.rateLimitTracker) {
            socket.rateLimitTracker.lastMessageType = 'text';
        }

        if (socket.roomName) {
            socket.to(socket.roomName).emit('receiveMessage', escapeHtml(message));
        }
    });

    socket.on('typing', () => {
        if (socket.roomName) {
            socket.to(socket.roomName).emit('partnerTyping');
        }
    });

    socket.on('stopTyping', () => {
        if (socket.roomName) {
            socket.to(socket.roomName).emit('partnerStopTyping');
        }
    });

    socket.on('sendImage', async (imageUrl) => {
        if (socket.roomName) {
            const tracker = socket.rateLimitTracker;
            const now = Date.now();
            
            if (tracker) {
                if (tracker.penaltyUntil > now) {
                    const remainingMins = Math.ceil((tracker.penaltyUntil - now) / 60000);
                    socket.emit('systemMessage', `[시스템] 이미지 도배 방지로 인해 ${remainingMins}분 동안 이미지를 보낼 수 없습니다.`);
                    return;
                }
                if (tracker.lastMessageType === 'image') {
                    socket.emit('systemMessage', '[시스템] 이미지는 연속으로 보낼 수 없습니다. 텍스트를 먼저 입력해주세요.');
                    return;
                }
                
                tracker.imageTimestamps.push(now);
                tracker.imageTimestamps = tracker.imageTimestamps.filter(t => now - t <= 10000);
                
                if (tracker.imageTimestamps.length >= 3) {
                    tracker.penaltyUntil = now + 3600000;
                    socket.emit('systemMessage', '[시스템] 10초 내 3장 이상 전송하여 1시간 동안 이미지 전송이 차단됩니다.');
                    return;
                }
                
                tracker.lastMessageType = 'image';
            }
           try {
                socket.to(socket.roomName).emit('receiveImage', imageUrl.url);
                if (imageUrl.filename && trackAndLimitImages) {
                    trackAndLimitImages(imageUrl.filename);
                }
            } catch (err) {
                console.error(err);
            }
        }
    });

    socket.on('sendFriendRequest', () => {
        if (socket.roomName) {
            const now = Date.now();
            if (socket.rateLimitTracker) {
                if (!socket.rateLimitTracker.friendReqTimestamps) socket.rateLimitTracker.friendReqTimestamps = [];
                socket.rateLimitTracker.friendReqTimestamps.push(now);
                socket.rateLimitTracker.friendReqTimestamps = socket.rateLimitTracker.friendReqTimestamps.filter(t => now - t <= 2000);
                if (socket.rateLimitTracker.friendReqTimestamps.length > 3) {
                    return;
                }
            }

            if (socket.friendList && socket.friendList.length >= 10) {
                socket.emit('systemMessage', '[시스템] 친구는 최대 10명까지만 추가할 수 있습니다.');
                return;
            }

            socket.friendRequestCount = (socket.friendRequestCount || 0) + 1;
            if (socket.friendRequestCount > 3) {
                socket.emit('systemMessage', '[시스템] 친구 요청은 한 방에서 최대 3회까지만 가능합니다.');
                return;
            }

            socket.to(socket.roomName).emit('receiveFriendRequest');
        }
    });

    socket.on('friendRequestAccepted', () => {
        if (socket.roomName) {
            socket.to(socket.roomName).emit('friendRequestSuccess');
        }
    });

    socket.on('friendRequestDeclined', () => {
        if (socket.roomName) {
            socket.to(socket.roomName).emit('friendRequestFailed');
        }
    });

    socket.on('leaveRoom', () => {
        if (socket.roomName) {
            socket.to(socket.roomName).emit('peerDisconnected');
            socket.leave(socket.roomName);
            socket.roomName = null;
        }
    });
};