var presApp = new Vue({
    el: "#app",
    data: {
        name:localStorage.getItem('name'),
        suname:localStorage.getItem('suname'),
        position: localStorage.getItem('position'),
        userid: localStorage.getItem('userid')|| null,
        loginid:null,
        isLogin: false,
        eventStatus:-1,
        needRescale:false,
    },
    methods: {
        login: async function () {
            if (this.name.length == 0)
                return;
            var r=await axios.post("/api/v1/spkLogin",{eventid,name:this.name, suname:this.suname, position:this.position,userid:this.userid})
                localStorage.setItem('name', this.name || "");
                localStorage.setItem('suname', this.suname || "");
                localStorage.setItem('position', this.position || "");
                localStorage.setItem('userid', r.data.userid);
                this.userid=r.data.userid;
                this.loginid=r.data.loginid;
            this.isLogin = true;
            setTimeout(()=>{activeteWebCam(this.loginid)}, 200);
        }
    },
    watch:{
        name:async function(){
            if( this.name && this.name.length>1){
                setTimeout(()=>{
                    const video = document.querySelector("#testVideo");
                   // if(!testVideoIsLoaded) {
                        initVideoDevices()
                        initTestVideo(video)
                  //  }
                },10)

            }
            else
            {
                testVideoIsLoaded=false;
            }
        }

    },
    mounted: async function () {
        var d=window.orientation==90 || window.orientation==-90
        console.log(d)
        mobileAndTabletCheck = function() {
            let check = false;
            (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
            return check;
        };
        this.needRescale=!d && mobileAndTabletCheck();
        var dt=await axios.get('/api/v1/eventStatus/'+eventid)
        this.eventStatus=dt.data.status;

        window.addEventListener("orientationchange", async ()=> {
            try{this.needRescale=window.orientation.indexOf("90")<0}catch (e){}
            var d=window.orientation==90 || window.orientation==-90
            this.needRescale=!d && mobileAndTabletCheck();
        }, false);

    }
});
constraints={audio:true,
    video:true//{

     //   maxBitrate: 1024000,
    //    minBitrate: 720000,
      //  width:{ ideal:1280, max:1280, min:640},
      //  height: { ideal:720,  max:720, min:360},
       // aspectRatio:  1.7777777778 /*,facingMode: 'user'*/},
      //  frameRate:{ideal:30}
//}
}
//constraints={audio:true, video:{ minBitrate:900,maxBitrate:1200,width:{ ideal:1280, max:1280, min:1280}, height: { ideal:720,  max:720, min:720},  aspectRatio:  1.7777777778 /*,facingMode: 'user'*/}}

testVideoIsLoaded=false;
async function initTestVideo(){
    console.log("initTestVideo");
    const video = document.querySelector("#testVideo");
    if(video)
        testVideoIsLoaded=true
    var stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log(stream);
    video.srcObject = stream;
    video.muted=true;
    video.play();
}
async function  initVideoDevices(){
    return;
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
//serverUrl = "wss://demo.flashphoner.com";
//if(typeof(roomid)!="undefined"  && roomid>90)
//var serverUrl = "wss://phone02.sber.link:8443";

var SESSION_STATUS = Flashphoner.constants.SESSION_STATUS;
var STREAM_STATUS = Flashphoner.constants.STREAM_STATUS;
var STREAM_STATUS_INFO = Flashphoner.constants.STREAM_STATUS_INFO;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");


function activeteWebCam(loginid) {


     localVideo = document.getElementById("localVideo");
     remoteVideo = document.getElementById("remoteVideo");

    Flashphoner.init();

    Flashphoner.createSession({urlServer: serverUrl}).on(SESSION_STATUS.ESTABLISHED, function (session) {
        //session connected, start streaming
        startStreaming(session, loginid);
        activatePgm(session);
    }).on(SESSION_STATUS.DISCONNECTED, function () {
        console.log("SESSION_STATUS.DISCONNECTED");

    }).on(SESSION_STATUS.FAILED, function () {
        console.log("SESSION_STATUS.FAILED");

    });
}

function startStreaming(session, loginid) {
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
        transport: "TCP",
        videoContentHint:"detail"
       // cvoExtension: true
    })
    .on(STREAM_STATUS.PUBLISHING, async function (publishStream) {
            console.log("STREAM_STATUS.PUBLISHING");

            await axios.post("/api/v1/webCamPublished",{streamName, eventid,faceid,userid:presApp.userid,loginid });
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

            var v=remoteVideo.querySelector("video");
           // v.addEventListener('loadeddata', function () {
                var pgmCtx = document.getElementById("pgmCanvas").getContext("2d");
                var inputCtx=[];
                for(var i=0;i<6;i++ ){
                    var ctx=document.getElementById("canvas"+i).getContext("2d")
                    inputCtx.push(ctx);
                }
                updateCanvas(pgmCtx, v, inputCtx); //Start rendering
            //});
        }).on(STREAM_STATUS.STOPPED, function(){
            console.log("remote STREAM_STATUS.STOPPED");
        }).on(STREAM_STATUS.FAILED, function(stream){
            //preview failed, stop publishStream
            console.log("remote STREAM_STATUS.FAILED", stream);
        });
        remoteSession.play()
}
function updateCanvas(pgmCtx, video, inputCtx) {
    // console.log(video.width,);

    pgmCtx.drawImage(video, 0, (video.videoHeight / 4), (video.videoWidth / 4) * 3, (video.videoHeight / 4) * 3, 0, 0, (1280 / 4) * 3, (720 / 4) * 3);
    var i=0;
    inputCtx.forEach(ctx=>{
        var dx = (video.videoWidth / 4);
        var dy = (video.videoHeight / 4)
        if (i < 4)
            ctx.drawImage(video, 0 + i * dx, 0, (video.videoWidth / 4), (video.videoHeight / 4), 0, 0, (1280 / 4), (720 / 4));
        else
            ctx.drawImage(video, 0 + 3 * dx, dy + dy * (i - 4), (video.videoWidth / 4), (video.videoHeight / 4), 0, 0, (1280 / 4), (720 / 4));
        i++;
    })
    requestAnimationFrame(()=>{updateCanvas(pgmCtx, video, inputCtx)}); // wait for the browser to be ready to present another animation fram.
}
