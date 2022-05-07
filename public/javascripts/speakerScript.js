var presApp=new Vue({
    el: "#presContainer",
    data: {
        name: localStorage.getItem('spkName'),
        position: localStorage.getItem('spkPosition'),
        isLogin:false,
    },
    methods: {
        login:async function(){
            if(this.name.length==0)
                return;
            localStorage.setItem('spkName', this.name||"");
            localStorage.setItem('spkPosition', this.position||"");
            this.isLogin=true;
        }
    },
    mounted: async function () {
    }
});
