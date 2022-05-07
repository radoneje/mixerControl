var presApp = new Vue({
    el: "#app",
    data: {
        name: localStorage.getItem('spkName'),
        position: localStorage.getItem('spkPosition'),
        isLogin: false,
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
    mounted: async function () {
        console.log("worked")
    }
});

var serverUrl = "wss://wowza02.onevent.online:8443";
//if(typeof(roomid)!="undefined"  && roomid>90)
//var serverUrl = "wss://phone02.sber.link:8443";

var SESSION_STATUS = Flashphoner.constants.SESSION_STATUS;
var STREAM_STATUS = Flashphoner.constants.STREAM_STATUS;
var STREAM_STATUS_INFO = Flashphoner.constants.STREAM_STATUS_INFO;
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
console.log(localVideo, "localVideo")

function activeteWebCam() {
    Flashphoner.init();
    Flashphoner.createSession({urlServer: serverUrl}).on(SESSION_STATUS.ESTABLISHED, function (session) {
        //session connected, start streaming
        startStreaming(session);
    }).on(SESSION_STATUS.DISCONNECTED, function () {
        console.log("SESSION_STATUS.DISCONNECTED");

    }).on(SESSION_STATUS.FAILED, function () {
        console.log("SESSION_STATUS.FAILED");

    });
}

function startStreaming(session) {
    console.log("startStreaming");
    var streamName = eventid + "_" + faceid;
    var publishStream=session.createStream({
        name: streamName,
        display: localVideo,
        cacheLocalResources: true,
        receiveVideo: false,
        receiveAudio: false,
        constraints: {audio:true, video:true},
    })
    .on(STREAM_STATUS.PUBLISHING, function (publishStream) {
            console.log("STREAM_STATUS.PUBLISHING");
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

    //.play();
    /* .on(STREAM_STATUS.PUBLISHING, function(publishStream){
         console.log("STREAM_STATUS.PUBLISHING");
         //play preview
         session.createStream({
             name: streamName,
             display: remoteVideo
         }).on(STREAM_STATUS.PLAYING, function(previewStream){
             //enable stop button
             onStarted(publishStream, previewStream);
         }).on(STREAM_STATUS.STOPPED, function(){
             publishStream.stop();
         }).on(STREAM_STATUS.FAILED, function(stream){
             //preview failed, stop publishStream
             if (publishStream.status() == STREAM_STATUS.PUBLISHING) {
                 console.log("STREAM_STATUS.FAILED", stream);
                 publishStream.stop();
             }
         }).play();
     }).on(STREAM_STATUS.UNPUBLISHED, function(){
     console.log("STREAM_STATUS.UNPUBLISHED");
     //enable start button
     onStopped();
 }).on(STREAM_STATUS.FAILED, function(stream){
     console.log("STREAM_STATUS.FAILED", stream);
     //enable start button
     onStopped();*/

}
