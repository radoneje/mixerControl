var presApp=new Vue({
    el: "#app",
    data: {
        name: localStorage.getItem('spkName'),
        position: localStorage.getItem('spkPosition'),
        isLogin:false,
    },
    methods: {
        login:async function(){
            console.log("login")
            if(this.name.length==0)
                return;
            localStorage.setItem('spkName', this.name||"");
            localStorage.setItem('spkPosition', this.position||"");
            this.isLogin=true;
            activeteWebCam();
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

function activeteWebCam(){
    Flashphoner.init();
}
