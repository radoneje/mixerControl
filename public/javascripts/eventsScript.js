var app = new Vue({
    el: "#app",
    data: {
        events: [],
        newEventTitle: "",
        newEventDescription: "",
        newEventDate: new Date()

    },
    methods: {
        deleteEvent:async function(item){
            if(!confirm("Delete this event?"))
                return;
            var r = (await axios.post("/api/v1/delEvent", {id: item.id})).data;
            r.forEach(deleted=>{
                this.events=this.events.filter((item)=>{
                    return item.id!=deleted.id;
                })
            });
        },
        addEvent: async function () {
            if (this.newEventTitle.length < 2)
                return;
            var r = (await axios.post("/api/v1/addEvent", {
                title: this.newEventTitle,
                descr: this.newEventDescription,
                date: this.newEventDate
            })).data;
            this.events.push(r)
            closeAddEventBox();
            this.newEventTitle = "";
            this.newEventDescription = "";
            this.newEventDate = new Date();
        },
        openMixer:async function(item){
            document.location.href="/event/"+item.id;
        }
    },
    mounted: async function () {
        this.events = (await axios.get("/api/v1/events")).data;

    }
})


flatpickr(document.getElementById('eventAddDate'), {
    enableTime: true,
    dateFormat: "d-m-d H:i",
    altInput: true,
    minDate: new Date(),
    "locale": "ru",
    time_24hr: true,
    onChange: (selectedDates, dateStr, instance) => {
        document.getElementById("eventAddDescr").focus();
        app.newEventDate = selectedDates;
    }
});

function closeAddEventBox() {
    document.querySelector(".addEventBox").classList.remove('flex')
    document.querySelector('body').classList.remove("modal-open")
}

function showAddEventBox() {
    document.querySelector(".addEventBox").classList.add('flex');
    document.querySelector('body').classList.add("modal-open");
    setTimeout(()=>{ document.querySelector('#eventAddTitle').focus();},0)


}


