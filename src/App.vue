<script>
import interact from 'interactjs'

export default {
    data() {
        return {
            message: "Hello world!"
        }
    },


    methods: {
        initialize() {


            function refreshCanvas(canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
                ctx.beginPath();
                ctx.arc(95, 50, 40, 0, 2 * Math.PI);
                ctx.stroke();
            }

            const canvas = document.querySelector("canvas");
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                refreshCanvas(canvas)
            });


            interact('.prompt').draggable({
                autoScroll: true,
                ignoreFrom: '.content',
                cursorChecker: () => null,
                listeners: {

                    move: (event) => {
                        var target = event.target
                        // keep the dragged position in the data-x/data-y attributes
                        var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx
                        var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy

                        // translate the element
                        target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

                        // update the posiion attributes
                        target.setAttribute('data-x', x)
                        target.setAttribute('data-y', y)

                        refreshCanvas(canvas);
                    }
                }
            });

        }
    },
    mounted: function () {
        this.initialize();
    }
}









</script>








<template>
    <div
        class="prompt  top-0 flex flex-col flex-wrap transition-shadow  bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200  p-6 absolute hover:outline-blue-300 hover:outline  hover:outline-1">
        
        <div class="transition-all cursor-pointer opacity-0 hover:opacity-20  h-16 fixed top-0 left-0 w-full bg-blue-200"></div>
        
        
        <div class="content w-72">
            <h1 class="h-14 z-10 font-bold prompt-title">Few-shot prompt</h1>
            
            <!-- Inputs -->
            <input
                class=" prompt-example  transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                type="text" name="exampleQuestion" placeholder="French: Bonjour" />
            <input
                class="mt-4 focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2 "
                type="text" placeholder="English: Good day" />
            <input
                class="mt-4  focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                type="text" placeholder="French: Sacre bleu!" />

            <!-- Controls -->
            <div class="flex mt-10 items-center justify-between ">
                <button class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>
                <div class="cursor-pointer basis-8 text-slate-400 hover:text-red-400 p-1 hover:bg-red-200 rounded-lg">
                    <svg class="svg-icon" viewBox="0 0 20 20" stroke-width="1" stroke="currentColor">
                        <path
                            d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z">
                        </path>
                    </svg>
                </div>
            </div>


        </div>
    </div>


    <div
        class="prompt top-0 flex flex-col  transition-shadow bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200  p-6 absolute hover:outline-blue-300 hover:outline  hover:outline-1">
        <div class="transition-all cursor-pointer  opacity-0 hover:opacity-20  h-16 fixed top-0 left-0 w-full bg-blue-200"></div>
        <div class="flex flex-col content w-72">
            <h1 class="h-14  font-bold">Freestyle prompt</h1>
            <!-- Inputs -->
            <textarea
                class="w-full peer   transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                type="text" name="exampleQuestion" placeholder="Hey, please generate some cool ideas for my project!" />


            <!-- Controls -->
            <div class="flex mt-10 items-center justify-between ">
                <button class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>
                <div class="cursor-pointer basis-8 text-slate-400 hover:text-red-400 p-1 hover:bg-red-200 rounded-lg">
                    <svg class="svg-icon" viewBox="0 0 20 20" stroke-width="1" stroke="currentColor">
                        <path
                            d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z">
                        </path>
                    </svg>
                </div>
            </div>
        </div>
    </div>
</template>

