var presApp=new Vue({
    el:"#presContainer",
    data:{
        presFolders:[],
    },
    methods:{
        deletePres:async function(item){
            if(!confirm("Delete this presentation?"))
                return;
            var r=(await axios.post('/api/v1/presFoldersDelete/', {id:item.id})).data;
            this.presFolders=this.presFolders.filter(rr=>{return rr.id!=r});
        },
        formatType:function(text){

            var match=text.match(/^([a-z]+)\//);
            return match[1];
        },
        addImage:async function(){
            var el=document.createElement("input");
            el.type="file";
            el.accept="image/jpeg,image/png,image/gif,video/mp4,application/pdf";
            el.multiple="multiple"
            el.style.display="none";
            el.onchange=(e)=>{
                console.log(el.files)

                var form = new FormData();
                for(var i=0; i<el.files.length ;i++){
                    form.append("photos", el.files[i], el.files[i].name)
                }

                form.append("mixerid", mixerId);
                const request = new XMLHttpRequest();
                request.open("POST", '/api/v1/addPresFiles', true);
                request.onreadystatechange = () => {
                    if (request.readyState === 4 && request.status === 200) {
                        //console.log("file UPLOADED", request.response);
                        this.presFolders.push(JSON.parse(request.response))
                        el.parentNode.removeChild(el);
                    }
                };
                request.onprogress=(event)=>{
                    console.log("progress event", event)
                }
                request.send(form);
            }
            document.body.appendChild(el)
            el.click();
        },
    },
    mounted:async function () {

        this.presFolders=(await axios.get('/api/v1/presFolders/'+mixerId)).data;
        console.log("d",this.presFolders);

    }
})

var socket = io();
socket.on('connection', (socket) => {
    console.log("socket connected")

});
socket.on('message', (m) => {
    var msg=JSON.parse(m);
    console.log('socket message: ', m);
});

var serverUrl = "wss://wowza02.onevent.online:8443";
//if(typeof(roomid)!="undefined"  && roomid>90)
//var serverUrl = "wss://phone02.sber.link:8443";

var SESSION_STATUS = Flashphoner.constants.SESSION_STATUS;
var STREAM_STATUS = Flashphoner.constants.STREAM_STATUS;
var STREAM_STATUS_INFO = Flashphoner.constants.STREAM_STATUS_INFO;
initFlashServer((result)=>{
    console.log(result, event)
}, (event, session)=>{
    console.log("server Event", event);
    if(event=="SESSION_STATUS.ESTABLISHED")
        playStream("mixerCore", session);
});

function initFlashServer(result, event) {
    Flashphoner.init({flashMediaProviderSwfLocation: '../../../../media-provider.swf'});
    console.log("SESSION_STATUS.INIT", serverUrl);

    Flashphoner.createSession({urlServer: serverUrl}).on(SESSION_STATUS.ESTABLISHED, function (session) {
        console.log("SESSION_STATUS.ESTABLISHED")
        event("SESSION_STATUS.ESTABLISHED", session)
        // onConnected(session);
    }).on(SESSION_STATUS.DISCONNECTED, function () {
        event("SESSION_STATUS.DISCONNECTED")

    }).on(SESSION_STATUS.FAILED, function () {
        event("SESSION_STATUS.FAILED")
    });
}
function playStream(streamName, session){

    conferenceStream = session.createStream({
        name: streamName,
        display: document.getElementById("remoteVideo"),
        constraints: {audio:true, video:true},
        flashShowFullScreenButton: true
    }).on(STREAM_STATUS.PENDING, function (stream) {

        console.log("STREAM_STATUS.PENDING");
    }).on(STREAM_STATUS.PLAYING, function (stream) {
        console.log("STREAM_STATUS.PLAYING");
        onVideoPlaying();
    }).on(STREAM_STATUS.STOPPED, function () {
        console.log("STREAM_STATUS.STOPPED");

    }).on(STREAM_STATUS.FAILED, function (stream) {
        console.log("STREAM_STATUS.FAILED");
    }).on(STREAM_STATUS.NOT_ENOUGH_BANDWIDTH, function (stream) {
        console.log("STREAM_STATUS.NOT_ENOUGH_BANDWIDTH");
    });
    conferenceStream.play();
}
function onVideoPlaying() {
    var pgmCtx = document.getElementById("pgmCanvas").getContext("2d");
    var elem= document.getElementById("spkRow")
    var canvasArr=[];

    for(var i=0; i<6; i++){
        var item=document.createElement("div")
        item.classList.add("spk")
        item.setAttribute("textureId",i)
        var itemCanvas=document.createElement("canvas");
        itemCanvas.setAttribute("textureId",i)
        itemCanvas.width=(1280/4);
        itemCanvas.height=(720/4);
        item.appendChild(itemCanvas);
        elem.appendChild(item);
        canvasArr.push(itemCanvas.getContext("2d"));
        item.addEventListener("click",async (e)=>{
            var r=(await axios.get("/showSpk/"+e.target.getAttribute("textureId"))).data;
            if(!r.error){
                document.querySelectorAll(".spk").forEach(elem=>{
                    elem.classList.remove("active");
                    if(elem.getAttribute("textureid")==r.ret){
                        elem.classList.add("active");
                    }
                })
            }
        })
    }

    var video=document.getElementById("remoteVideo").querySelector('video');
    video.controls=false;
    video.muted=false;
    document.getElementById("loader").style.display="none"
    video.addEventListener('loadeddata', function() {

        updateCanvas(); //Start rendering
    });

    function updateCanvas(){

        pgmCtx.drawImage(video,0,(720/4),(1280/4)*3, (720/4)*3, 0,0,(1280/4)*3,(720/4)*3);
        for(var i=0;i<6;i++){
            var dx=(1280/4);
            var dy=(720/4)
            if(i<4)
                canvasArr[i].drawImage(video,0+i*dx,0,(1280/4), (720/4), 0,0,(1280/4),(720/4));
            else
                canvasArr[i].drawImage(video,0+3*dx,dy+dy*(i-4),(1280/4), (720/4), 0,0,(1280/4),(720/4));

        }
        requestAnimationFrame(updateCanvas); // wait for the browser to be ready to present another animation fram.
    }

}


