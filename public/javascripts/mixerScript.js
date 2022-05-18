var presApp=new Vue({
    el:"#app",
    data:{
        presFolders:[],
        event:{status:0},
        isLoaded:false
    },
    methods:{
        activetePresImg:async function (img){
            console.log("activatePresImg", img)
            var r=(await axios.get("/api/v1/activatePresImg/"+img.id+"/"+eventid)).data;
            if(!r.error){
                if(!r.ret.error)
                {
                    var activepresFileId=r.ret.presFileId;
                }
                ////
            }
        },
        addImageToFolder:function (folderid, value){

           this.presFolders.forEach(f=>{
               if(f.id==folderid){
                   f.images.push(value);
               }
           })
        },
        deletePres:async function(item){
            if(!confirm("Delete this presentation?"))
                return;
            var r=(await axios.post('/api/v1/presFoldersDelete/', {id:item.id, eventid})).data;
           // this.presFolders=this.presFolders.filter(rr=>{return rr.id!=r});
        },
        onPresFoldersDelete:function (id){
            this.presFolders=this.presFolders.filter(rr=>{return rr.id!=id});
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
                var form = new FormData();
                for(var i=0; i<el.files.length ;i++){
                    form.append("photos", el.files[i], el.files[i].name)
                }
                form.append("eventid", eventid);
                const request = new XMLHttpRequest();
                request.open("POST", '/api/v1/addPresFiles', true);
                request.onreadystatechange = () => {
                    if (request.readyState === 4 && request.status === 200) {
                        //console.log("file UPLOADED", request.response);
                        //this.presFolders.push(JSON.parse(request.response))
                        el.parentNode.removeChild(el);
                    }
                };
                request.onprogress=(event)=>{
                    console.log("progress event", event)
                    //TODO: add file progresss
                }
                request.send(form);
            }
            document.body.appendChild(el)
            el.click();
        },
        onAddPresFolder:function(value){
            this.presFolders.push(value)
        }
    },
    watch:{
        event:async function(){
            console.log("event change");
            if(this.event.status==1)
               setTimeout( onAppStart(), 100);
        }
    },
    mounted:async function () {
        this.presFolders=(await axios.get('/api/v1/presFolders/'+eventid)).data;
        this.isLoaded=true;
        var dt=await axios.get('/api/v1/eventStatus/'+eventid)
        this.event=dt.data
    }
})

function onAppStart() {
    console.log("on start")
    var socket = io();
    socket.on('connection', (socket) => {
        console.log("socket connected")
    });
    socket.on('message', (m) => {

        var msg = JSON.parse(m);


        if (msg.eventid != eventid)
            return

        console.log('socket message: ', msg, eventid);
        console.log('socket message2: ', eventid);
        if (msg.cmd == "activateSpk") {
            activateSpk(msg.id)
        }
        if (msg.cmd == "addPresImg") {
            presApp.addImageToFolder(msg.folderid, msg.value)
        }
        if (msg.cmd == "presFoldersDelete") {
            presApp.onPresFoldersDelete(msg.id)
        }
        if (msg.cmd == "addPresFolder") {
            presApp.onAddPresFolder(msg.value)
        }
        if (msg.cmd == "activatePresFile") {
            activatePresFile(msg.presFileId)
        }


    });

    function activatePresFile(id) {
        console.log("activatePresFile", id)
        document.querySelectorAll(".mayActive").forEach(elem => {
            elem.classList.remove("active");
            if (elem.getAttribute("textureid") == id) {
                elem.classList.add("active");
            }
        })
    }

    function activateSpk(spkId) {
        document.querySelectorAll(".mayActive").forEach(elem => {
            elem.classList.remove("active");
            if (elem.getAttribute("textureid") == spkId) {
                elem.classList.add("active");
            }
        })
    }

    var serverUrl = "wss://wowza02.onevent.online:8443";
//if(typeof(roomid)!="undefined"  && roomid>90)
//var serverUrl = "wss://phone02.sber.link:8443";

    var SESSION_STATUS = Flashphoner.constants.SESSION_STATUS;
    var STREAM_STATUS = Flashphoner.constants.STREAM_STATUS;
    var STREAM_STATUS_INFO = Flashphoner.constants.STREAM_STATUS_INFO;
    initFlashServer((result) => {

    }, (event, session) => {

        if (event == "SESSION_STATUS.ESTABLISHED")
            playStream(eventid, session);
    });

    function initFlashServer(result, event) {
        Flashphoner.init({flashMediaProviderSwfLocation: '../../../../media-provider.swf'});
        Flashphoner.createSession({urlServer: serverUrl}).on(SESSION_STATUS.ESTABLISHED, function (session) {
            event("SESSION_STATUS.ESTABLISHED", session)
            // onConnected(session);
        }).on(SESSION_STATUS.DISCONNECTED, function () {
            event("SESSION_STATUS.DISCONNECTED")
        }).on(SESSION_STATUS.FAILED, function () {
            event("SESSION_STATUS.FAILED")
        });
    }

    function playStream(streamName, session) {

        conferenceStream = session.createStream({
            name: streamName,
            display: document.getElementById("remoteVideo"),
            constraints: {audio: true, video: true},
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
        var elem = document.getElementById("spkRow")
        var canvasArr = [];

        for (var i = 0; i < 6; i++) {
            var item = document.createElement("div")
            item.classList.add("spk")
            item.classList.add("mayActive")
            item.setAttribute("textureId", i)
            var itemCanvas = document.createElement("canvas");
            itemCanvas.setAttribute("textureId", i)
            itemCanvas.width = (1280 / 4);
            itemCanvas.height = (720 / 4);
            item.appendChild(itemCanvas);
            elem.appendChild(item);
            canvasArr.push(itemCanvas.getContext("2d"));
            item.addEventListener("click", async (e) => {
                var r = (await axios.get("/showSpk/" + e.target.getAttribute("textureId") + "/" + eventid)).data;
                if (!r.error) {
                    ////
                }
            });
            var openWebCamBtn = document.createElement("div")
            openWebCamBtn.classList.add("webCamBtn");
            openWebCamBtn.innerHTML = "webCam" + (i + 1);
            openWebCamBtn.setAttribute("faceid", i);
            item.appendChild(openWebCamBtn)
            openWebCamBtn.addEventListener("click", async (e) => {
                console.log(e.target.getAttribute("faceid"));
                e.preventDefault();
                e.stopPropagation();
                if (e.target.classList.contains("clicked"))
                    return false;
                navigator.clipboard.writeText("https://mixer.rustv.ru/speaker/" + eventid + "/" + e.target.getAttribute("faceid"));
                var tmp = e.target.innerHTML;
                e.target.classList.add("clicked");
                e.target.innerHTML = "link is copyed";
                setTimeout(() => {
                    e.target.classList.remove("clicked");
                    e.target.innerHTML = tmp;
                }, 2000);
            })
        }

        var video = document.getElementById("remoteVideo").querySelector('video');
        video.controls = false;
        video.muted = false;
       // document.getElementById("loader").style.display = "none"
        video.addEventListener('loadeddata', function () {

            updateCanvas(); //Start rendering
        });

        function updateCanvas() {
           // console.log(video.width,);

            pgmCtx.drawImage(video, 0, (video.videoHeight / 4), (video.videoWidth / 4) * 3, (video.videoHeight / 4) * 3, 0, 0, (1280 / 4) * 3, (720 / 4) * 3);
            for (var i = 0; i < 6; i++) {
                var dx = (video.videoWidth / 4);
                var dy = (video.videoHeight / 4)
                if (i < 4)
                    canvasArr[i].drawImage(video, 0 + i * dx, 0, (video.videoWidth / 4), (video.videoHeight / 4), 0, 0, (1280 / 4), (720 / 4));
                else
                    canvasArr[i].drawImage(video, 0 + 3 * dx, dy + dy * (i - 4), (video.videoWidth / 4), (video.videoHeight / 4), 0, 0, (1280 / 4), (720 / 4));

            }
            requestAnimationFrame(updateCanvas); // wait for the browser to be ready to present another animation fram.
        }


    }
}


