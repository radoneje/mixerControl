var presApp = new Vue({
    el: "#app",
    data: {
        name:"",
        position: localStorage.getItem('spkPosition'),
        isLogin: false,
        eventStatus:-1,
    },
    methods: {
        login: async function () {
            console.log("login")
            if (this.name.length == 0)
                return;
            localStorage.setItem('spkName', this.name || "");
            localStorage.setItem('spkPosition', this.position || "");
            this.isLogin = true;
            setTimeout(activeteWebCam, 200);



        }
    },
    watch:{
        name:async function(){
            if( this.name && this.name.length>1){
                setTimeout(()=>{
                    const video = document.querySelector("#testVideo");
                    if(!testVideoIsLoaded) {
                        initVideoDevices()
                        initTestVideo(video)
                    }
                },0)

            }
            else
            {
                testVideoIsLoaded=false;
            }
        }

    },
    mounted: async function () {
        var dt=await axios.get('/api/v1/eventStatus/'+eventid)
        this.eventStatus=dt.data.status;
        setTimeout(()=>{  this.name=localStorage.getItem('spkName');},0)

    }
});
constraints={audio:true, video:{ width:{ ideal:640, max:640}, height: { ideal:360,  max:360},  aspectRatio:  1.7777777778 /*,facingMode: 'user'*/}}
testVideoIsLoaded=false;
async function initTestVideo(){
    const video = document.querySelector("#testVideo");
    if(video)
        testVideoIsLoaded=true
    var stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.muted=true;
    video.play();
}
async function  initVideoDevices(){
    const devices = await navigator.mediaDevices.enumerateDevices();

    var videoSelect=document.getElementById("videoselect")
    var audioselect=document.getElementById("audioselect")
    devices.forEach(d=>{
        if(d.kind=="videoinput"){
            var option= document.createElement("option")
            option.innerHTML=d.label;
            option.value=d.deviceId;
            videoSelect.appendChild(option);
        }
        if(d.kind=="audioinput"){
            var option= document.createElement("option")
            option.innerHTML=d.label;
            option.value=d.deviceId;
            audioselect.appendChild(option);
        }

    });
    videoSelect.addEventListener("change",async (e)=>{
        if(videoSelect.value=="-1" && constraints.video.deviceId)
            delete  constraints.video.deviceId
        if(videoSelect.value!="-1" )
            constraints.video.deviceId=videoSelect.value
        await initTestVideo();
    })
    audioselect.addEventListener("change",async (e)=>{
        if(audioselect.value=="-1" && constraints.audio.deviceId)
            delete  constraints.video.deviceId
        if(audioselect.value!="-1" )
            constraints.audio.deviceId=audioselect.value
        await initTestVideo();
    })


}
 async function changeCameraType(e){
    if (e.value==1)
        constraints.video.facingMode="environment"
    else
        constraints.video.facingMode="user"
     await initTestVideo();
}
var serverUrl = "wss://wowza02.onevent.online:8443";
//if(typeof(roomid)!="undefined"  && roomid>90)
//var serverUrl = "wss://phone02.sber.link:8443";

var SESSION_STATUS = Flashphoner.constants.SESSION_STATUS;
var STREAM_STATUS = Flashphoner.constants.STREAM_STATUS;
var STREAM_STATUS_INFO = Flashphoner.constants.STREAM_STATUS_INFO;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");


function activeteWebCam() {
    window.addEventListener("orientationchange", function() {
        // Announce the new orientation number
        document.getElementById("test").innerHTML(screen.orientation);
    }, false);

     localVideo = document.getElementById("localVideo");
     remoteVideo = document.getElementById("remoteVideo");
    console.log(localVideo, "localVideo")
    Flashphoner.init();

    Flashphoner.createSession({urlServer: serverUrl}).on(SESSION_STATUS.ESTABLISHED, function (session) {
        //session connected, start streaming
        startStreaming(session);
        activatePgm(session);
    }).on(SESSION_STATUS.DISCONNECTED, function () {
        console.log("SESSION_STATUS.DISCONNECTED");

    }).on(SESSION_STATUS.FAILED, function () {
        console.log("SESSION_STATUS.FAILED");

    });
}

function startStreaming(session) {
    var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    stripCodecs=null
   // if(isSafari)
        stripCodecs: "h264,H264"
    console.log("startStreaming, stripCodecs:", stripCodecs);
    var streamName = eventid + "_" + faceid;
    console.log("streamName",streamName);
    var publishStream=session.createStream({
        name: streamName,
        display: localVideo,
        cacheLocalResources: true,
        receiveVideo: false,
        receiveAudio: false,
        disableConstraintsNormalization:true,
        constraints: constraints,//{audio:true, video:{ width: 1280, height: 720,  aspectRatio:  1.7777777778}},
        stripCodecs:stripCodecs,
       // cvoExtension: true
    })
    .on(STREAM_STATUS.PUBLISHING, async function (publishStream) {
            console.log("STREAM_STATUS.PUBLISHING");
            await axios.post("/api/v1/webCamPublished",{streamName, eventid,faceid});
        document.querySelectorAll("video").forEach(v=>v.setAttribute("playsinline",""));
        })
    .on(STREAM_STATUS.UNPUBLISHED, function () {
            console.log("STREAM_STATUS.UNPUBLISHED");
            //enable start button

        })
    .on(STREAM_STATUS.FAILED, function (stream) {
        console.log("STREAM_STATUS.FAILED   1", stream);
        //enable start button

    })
    publishStream.publish();


}
function activatePgm(session){
    var remoteSession=session.createStream({
        name: eventid,
        display: remoteVideo
    })
        .on(STREAM_STATUS.PLAYING, function(previewStream){
            //enable stop button
            //onStarted(publishStream, previewStream);
            console.log("remote STREAM_STATUS.PLAYING", previewStream);
            document.querySelectorAll("video").forEach(v=>v.setAttribute("playsinline",""));
        }).on(STREAM_STATUS.STOPPED, function(){
            console.log("remote STREAM_STATUS.STOPPED");
        }).on(STREAM_STATUS.FAILED, function(stream){
            //preview failed, stop publishStream
            console.log("remote STREAM_STATUS.FAILED", stream);
        });
        remoteSession.play()
}
