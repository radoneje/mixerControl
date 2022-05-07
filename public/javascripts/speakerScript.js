var presApp=new Vue({
    el: "#presContainer",
    data: {
        name: "dd",//localStorage.getItem('spkName'),
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
        }
    },
    mounted: async function () {
        console.log("worked")
    }
});
