import {ZegoUIKitPrebuilt} from '@zegocloud/zego-uikit-prebuilt';
import { ZEGO_CONFIG } from '../utils/constants';


let zegoInstance = null;
let userHasJoined = false;
let isDestroying = false;
const JOIN_TIMEOUT_MS = 45000;

const getMediaErrorMessage = (error) => {
    const errorName = error?.name || '';

    if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        return 'Camera or microphone permission denied. Please allow access in your browser settings and try again.';
    }

    if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        return 'Camera or microphone device not found on this phone.';
    }

    if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        return 'Camera or microphone is busy in another app. Close other camera apps and try again.';
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        return 'Camera and microphone require HTTPS on mobile devices. Open this app with an HTTPS URL and try again.';
    }

    return 'Unable to access camera or microphone on this device.';
};

const getReadableZegoError = (error) => {
    const message = `${error?.message || error?.msg || error?.content || error || ''}`;
    const lowerMessage = message.toLowerCase();

    if (!ZEGO_CONFIG.SERVER_SECRET) {
        return 'ZEGO server secret is missing. Add REACT_APP_ZEGO_SERVER_SECRET in client/.env and restart the app.';
    }

    if (lowerMessage.includes('notallowederror') || lowerMessage.includes('permission denied')) {
        return 'Camera or microphone permission denied. Please allow access in your browser settings and try again.';
    }

    if (message.includes('1102016') || lowerMessage.includes('liveroom error')) {
        return 'Unable to join the ZEGO room. Please verify REACT_APP_ZEGO_APP_ID and REACT_APP_ZEGO_SERVER_SECRET.';
    }

    if (message.includes('200014') || lowerMessage.includes('token')) {
        return 'ZEGO token authentication failed. Please verify the ZEGO App ID and Server Secret.';
    }

    if (lowerMessage.includes('notreadableerror') || lowerMessage.includes('device is not readable')) {
        return 'Camera or microphone is busy in another app on this phone. Close the other app and try again.';
    }

    return message || 'Failed to join the video room.';
};


export const generateKitToken = (roomId,userId,userName) => {
    if(!ZEGO_CONFIG.APP_ID){
        throw new Error('ZEGOCLOUD App Id not configured. Please set the value in env')
    }

    if(!ZEGO_CONFIG.SERVER_SECRET){
        throw new Error('ZEGOCLOUD Server Secret not configured. Please set REACT_APP_ZEGO_SERVER_SECRET in env')
    }

    const appId = parseInt(ZEGO_CONFIG.APP_ID);
    if(isNaN(appId)){
        throw new Error('Invalid Zegocloud app id .Must be in number')
    }

    try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest( 
            appId,
            ZEGO_CONFIG.SERVER_SECRET || '',
            roomId,
            userId.toString(),
            userName || `User_${userId}`
        )

        if(!kitToken){
            throw new Error('Token generation returned empty token')
        }

        return kitToken;
    } catch (error) {
        console.error('Token generation error', error);
        throw new Error(`Failed to generate zego token: ${error.message}`)
    }
}


//Request  brower permission for camera and mixrophone

const requestMediaPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
        return {
            granted: false,
            reason: 'Media devices API is not available in this browser.',
        };
    }

    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        return {
            granted: false,
            reason: 'Camera and microphone require HTTPS on mobile browsers.',
        };
    }

    try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video:true,
            audio:true
         })
         stream.getTracks().forEach(track => track.stop());
         return { granted: true, reason: '' };
    } catch (error) {
     console.error('Failed to get media permission',error);
     return {
        granted: false,
        reason: getMediaErrorMessage(error),
     };
    }
}

export const joinRoom = async(roomId,userId,userName,container,onJoinCallback,onLeaveCallback) => {
    if(!container){
        throw new Error('Container element is required')
    }


    if(!ZEGO_CONFIG.APP_ID){
        throw new Error('Zegocloud App Id is not configured')
    }

    //clean up exiting instance if any 
    if(zegoInstance && !isDestroying){
        try {
             isDestroying= true;
             const instance = zegoInstance;
             zegoInstance= null;


             if(instance && typeof instance.destroy === 'function'){
                instance.destroy();
             }

             userHasJoined = false;
        } catch (error) {
            console.error('Error cleaning up exiting zego instance',error)
        }finally{
            isDestroying= false;
        }
    }


    let hasPermission = false;
    let mediaPermissionReason = '';
    try {
        const mediaPermission = await requestMediaPermission();
        hasPermission = mediaPermission.granted;
        mediaPermissionReason = mediaPermission.reason;
        if(!hasPermission){
            console.warn('Medai permission not granted upfront, SDK will request them', mediaPermissionReason)
        }
    } catch (error) {
        console.warn('cound not pre-request permission ,SDK will handle it', error)
    }


    let kitToken;
    try {
        kitToken = generateKitToken(roomId,userId,userName);
        if(!kitToken){
            throw new Error('failed to generate kit token')
        }
    } catch (error) {
        console.error('token generation error',error);
        throw new Error(`faild to generate zego token: ${error.message}`)
    }

    //Create a ZEGO UIkIT instance
    let zp;
    try {
         zp = ZegoUIKitPrebuilt.create(kitToken);
         if(!zp){
            throw new Error('failed to create zego Uikit instance')
         }
    } catch (error) {
           console.error('ZEGO instance creation error',error);
        throw new Error(`faild to create Zego instace: ${error.message}`)
    }

    //small delay
    await new Promise(resolve => setTimeout(resolve,100))

    //join room with prebuild ui 
    try {
        zegoInstance= zp;

        await new Promise((resolve, reject) => {
            let settled = false;
            const settleSuccess = () => {
                if (settled) return;
                settled = true;
                resolve();
            };
            const settleFailure = (error) => {
                if (settled) return;
                settled = true;
                reject(error);
            };

            const joinTimeout = setTimeout(() => {
                clearTimeout(joinTimeout);
                settleFailure(new Error('Timed out while joining the video room. If the pre-join screen is visible, click "Join" to continue.'));
            }, JOIN_TIMEOUT_MS);

            zp.joinRoom({
                container:container,
                scenario:{
                    mode:ZegoUIKitPrebuilt.GroupCall,
                },
                showPreJoinView:true,
                turnOnCameraWhenJoining:hasPermission,
                turnOnMicrophoneWhenJoining:hasPermission,
                showMyCameraToggleButton:true,
                showMyMicrophoneToggleButton:true,
                showAudioVideoSettingsButton:true,
                showTextChat:true,
                showUserList:true,
                onJoinRoom: () => {
                    clearTimeout(joinTimeout);
                    userHasJoined = true;
                    if(onJoinCallback && typeof onJoinCallback === 'function'){
                        onJoinCallback();
                    }
                    settleSuccess();
                },
                onLeaveRoom: () => {
                    userHasJoined= false;
                    if(onLeaveCallback && typeof onLeaveCallback === 'function'){
                        onLeaveCallback();
                    }
                },
                onError: (error) => {
                    clearTimeout(joinTimeout);
                    console.error('ZEGO room error', error)
                    settleFailure(new Error(getReadableZegoError(error)));
                },
            });
        });
    } catch (error) {
        console.error('Error joining Zego room', error);
        if(zp && typeof zp.destroy === 'function' && !isDestroying){
            try {
                isDestroying = true;
                zp.destroy();
            } catch (error) {
                console.error('Error destring zego instance',error)
            }finally{
                isDestroying=false;
            }
        }
        zegoInstance = null;
        userHasJoined=false;
        const message = error?.message || 'Failed to join the video room.';
        if (mediaPermissionReason && !hasPermission) {
            if (message.toLowerCase().includes('timed out')) {
                throw new Error(mediaPermissionReason);
            }
            throw new Error(`${message} ${mediaPermissionReason}`);
        }

        throw new Error(message);
    }
    return zp;
}



export const leaveRoom = (onLeaveCallback) => {
    if(!zegoInstance || isDestroying){
        if(onLeaveCallback && typeof onLeaveCallback === 'function'){
            onLeaveCallback();
        }
            return;
    }


    isDestroying= true;
    const instance = zegoInstance;
    zegoInstance= null;
    userHasJoined= false;


    if(onLeaveCallback && typeof onLeaveCallback === 'function'){
        try {
             onLeaveCallback();
        } catch (error) {
            console.error('error in leaveRoom callback', error)
        }
    }

    try {
         if(instance && typeof instance.destroy === 'function'){
            instance.destroy();
         }else if(instance && typeof instance.leaveRoom === 'function'){
            instance.leaveRoom();
         }
    } catch (error) {
        console.error('Error leaving zego room', error)
    }finally{
        isDestroying = false;
    }
}


export const getZegoInstance = () => {
    return zegoInstance;
}


export const hasUserJoined = () => {
    return userHasJoined;
}
