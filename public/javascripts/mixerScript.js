var presApp=new Vue({
    el:"#app",
    data:{
        presFolders:[],
        event:{status:0},
        isLoaded:false
    },

    methods:{
        videoFileLoopChange:async function (item){
            var r=(await axios.post("/api/v1/videoFileLoopChange/"+eventid,item)).data;
        },
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
            console.log("event change", this.event.status);
            if(this.event.status==1) {
                setTimeout(()=>{
                    console.log("onAppStart", this.event.status);
                    onAppStart();
                }, 500);

            }
        }
    },
    mounted:async function () {
        this.presFolders=(await axios.get('/api/v1/presFolders/'+eventid)).data;
        this.isLoaded=true;
        var dt=await axios.get('/api/v1/eventStatus/'+eventid)
        this.event=dt.data;
        if(this.event.status==0) {
            await axios.post('/api/v1/startEvent/' + eventid)
        }


    }
})


function test(){
    socket.emit("message", JSON.stringify({event:"mixer", eventid}));
}

    var socket = io();
socket.on('connect', ()=>{
    console.log(socket.id);
    socket.emit("message", JSON.stringify({event:"mixer", eventid, status:this.event.status }));
})
//
    socket.on('message', (m) => {

        var msg = JSON.parse(m);

        if (msg.eventid!= eventid)
            return;

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
        if (msg.cmd == "eventChangeStatus") {
            console.log("eventChangeStatus",presApp.event.status,msg.status)
            presApp.event.status=msg.status;
            if(msg.status==1)
                onAppStart();
        }
        if (msg.cmd == "inputChangeStatus") {
            console.log("inputChangeStatus",msg.status)
            var box=document.querySelector(".spk[textureid='"+msg.input+"']");
            box.querySelectorAll(".blankInput").forEach(e=>{
                console.log("box", e)
            })

            if(msg.status==0)
            {
                box.querySelectorAll(".blankInput").forEach(e=>{e.classList.remove("hidden"); e.classList.add("block")})
                box.querySelectorAll(".workInput").forEach(e=>{e.classList.add("hidden"); e.classList.remove("block")})
                box.querySelector(".openWebCamTitleName").innerHTML=""
                box.querySelector(".openWebCamTitlePos").innerHTML=""
            }
            else
            {
                box.querySelectorAll(".blankInput").forEach(e=>{e.classList.add("hidden"); e.classList.remove("block")})
                box.querySelectorAll(".workInput").forEach(e=>{e.classList.remove("hidden"); e.classList.add("block")})

                if(msg.title) {
                    box.querySelector(".openWebCamTitleName").innerHTML = (msg.title.name||"") + " " +(msg.title.suname||"")
                    box.querySelector(".openWebCamTitlePos").innerHTML = msg.title.position||""
                }
            }

        }
        if (msg.cmd == "videoFileLoopChange") {
            presApp.presFolders.forEach(folder=>{
                if(folder.id==msg.folderid){
                    folder.images.forEach(image=>{
                        if(image.id==msg.fileid)
                            image.islooped=msg.islooped
                    })
                }
            })
        }
        console.log("msg", msg);
    });

    function eventChangeStatus(id) {
        console.log("activatePresFile", id)

    }
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
function onAppStart() {
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
        }).on(STREAM_STATUS.PLAYING, async (stream) =>{
            console.log("STREAM_STATUS.PLAYING");
            await onVideoPlaying();
        }).on(STREAM_STATUS.STOPPED, function () {
            console.log("STREAM_STATUS.STOPPED");

        }).on(STREAM_STATUS.FAILED, function (stream) {
            console.log("STREAM_STATUS.FAILED");
        }).on(STREAM_STATUS.NOT_ENOUGH_BANDWIDTH, function (stream) {
            console.log("STREAM_STATUS.NOT_ENOUGH_BANDWIDTH");
        });
        conferenceStream.play();
    }

  async  function onVideoPlaying() {
        var pgmCtx = document.getElementById("pgmCanvas").getContext("2d");
        var elem = document.getElementById("spkRow")
        var canvasArr = [];
        var dt=(await axios.get('/api/v1/eventStatus/'+eventid)).data;
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
            openWebCamBtn.classList.add("blankInput");
            console.log(dt);
            openWebCamBtn.classList.add(dt.inputs[i].isActive?"hidden":"block");
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

            var openWebCamTitle = document.createElement("div")
            openWebCamTitle.classList.add("openWebCamTitle");
            openWebCamTitle.classList.add("workInput");
            openWebCamTitle.classList.add(dt.inputs[i].isActive?"block":"hidden");
            openWebCamTitle.setAttribute("faceid", i);

            var openWebCamTitleName = document.createElement("div")
            openWebCamTitleName.classList.add("openWebCamTitleName");
            if(dt.inputs[i].title)
                openWebCamTitleName.innerHTML=dt.inputs[i].title.name +" " +dt.inputs[i].title.suname
            openWebCamTitle.appendChild(openWebCamTitleName)

            var openWebCamTitlePos = document.createElement("div")
            openWebCamTitlePos.classList.add("openWebCamTitlePos");
            if(dt.inputs[i].title)
                openWebCamTitlePos.innerHTML=dt.inputs[i].title.position
            openWebCamTitle.appendChild(openWebCamTitlePos)

            item.appendChild(openWebCamTitle)
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


