<script>
import { v4 as uuidv4 } from 'uuid';
import interact from 'interactjs'
import { Configuration, OpenAIApi } from 'openai';

let id = 0;



export default {

    data() {
        return {
            message: "Hello world!",
            apiKey: '',

            prompts: [

            ]
        }
    },


    methods: {
        initialize() {
            function refreshCanvas(canvas) {
                const ctx = canvas.getContext("2d");
                ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
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
                        let promptIndex = this.prompts.findIndex((p) => p.id == target.id);


                        let x = this.prompts[promptIndex].x + event.dx
                        let y = this.prompts[promptIndex].y + event.dy

                        target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

                        this.prompts[promptIndex].x = x;
                        this.prompts[promptIndex].y = y;
                        refreshCanvas(canvas);
                    }
                }
            });


            function getOffset(el) {
                const rect = el.getBoundingClientRect();
                return {
                    left: rect.left + window.scrollX,
                    top: rect.top + window.scrollY,
                    right: rect.right + window.scrollX,
                    bottom: rect.bottom + window.scrollY
                };
            }

            interact('.output-node').draggable({
                autoScroll: true,

                cursorChecker: () => null,
                listeners: {
                    end: (event) => {
                        refreshCanvas(canvas);

                    },
                    move: (event) => {

                        refreshCanvas(canvas);
                        let ctx = canvas.getContext("2d");

                        let rect = getOffset(event.target);

                        let y = (rect.top + rect.bottom) / 2;
                        let x = (rect.left + rect.right) / 2;

                        ctx.beginPath();


                        ctx.moveTo(x, y);
                        ctx.lineTo(event.pageX, event.pageY);
                        ctx.lineWidth = 10.0;
                        ctx.lineCap = "round";
                        ctx.strokeStyle = "lightblue"
                        ctx.stroke()
                        ctx.closePath();
                    }
                }
            });

        },



        createPrompt(type) {

            let startX = Math.min(960, Math.max(window.innerWidth * Math.random(), 100));
            let startY = Math.min(600, Math.max(window.innerWidth * Math.random(), 50));

            this.prompts.push({ id: uuidv4(), type: type, x: startX, y: startY });
        },

        deletePrompt(promptID) {
            this.prompts = this.prompts.filter((p) => p.id !== promptID);
        },

        async executePrompt(prompt) {

            const configuration = new Configuration({
                apiKey: this.apiKey,
            });

            delete configuration.baseOptions.headers['User-Agent'];

            const openai = new OpenAIApi(configuration);


            let promptText = '';

            switch (prompt.type) {
                case 'fewshot':
                    promptText = prompt.taskA + "\n" + prompt.answerA + "\n" + prompt.taskB;
                    break;


                case 'freestyle':
                    promptText = prompt.input
                    break;

            }
            let idx = this.prompts.findIndex((p) => p.id == prompt.id);

    


            if (prompt.type === 'image') {
                const completion = await openai.createImage({
                    prompt: prompt.input,
                    n: 1,
                    size: "256x256",
                });

                console.log(completion);    
                this.prompts[idx].response = completion.data.data[0].url;
            }

            else {
                const completion = await openai.createChatCompletion({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: promptText }],
                });


                this.prompts[idx].response = completion.data.choices[0].message.content;
            }



        },

        retranslatePrompts() {
            this.prompts.forEach(prompt => {
                let el = document.getElementById(prompt.id);
                el.style.transform = 'translate(' + prompt.x + 'px, ' + prompt.y + 'px)'
            });
        }


    },
    mounted: function () {
        this.initialize();
    },

    updated: function () {
        this.retranslatePrompts();
    }
}

</script>








<template>
    <div v-for="prompt in prompts">
        <div v-if="prompt.type === 'fewshot'" :id="prompt.id" :key="prompt.id"
            class="absolute prompt top-0 left-0   flex flex-col flex-wrap transition-shadow p-6 bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200    hover:outline-blue-300 hover:outline  hover:outline-1">

            <div
                class="drag-zone transition-all cursor-pointer opacity-0 hover:opacity-20  h-16 absolute top-0 left-0 w-full bg-blue-200">
            </div>

            <div
                class="output-node w-10 h-10 absolute cursor-pointer -top-5 -right-5 bg-blue-600 rounded-full shadow-lg  shadow-violet-200 hover:shadow-xl">
            </div>


            <div class="content w-72">
                <h1 class="h-14 z-10 font-bold prompt-title">Few-shot prompt</h1>

                <div v-if="prompt.processed">
                    {{ prompt.response.data.choices[0].message.content }}
                </div>
                <div v-else>
                    <input v-model="prompt.taskA"
                        class="prompt-example focus:placeholder-transparent  transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                        type="text" name="taskExample" placeholder="French: Bonjour" />
                    <input v-model="prompt.answerA"
                        class="mt-4 focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2 "
                        type="text" name="answerExample" placeholder="English: Good day" />
                    <input v-model="prompt.taskB"
                        class="mt-4  focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                        type="text" name="task" placeholder="French: Sacre bleu!" />
                </div>

                <div class="controls flex mt-10 items-center justify-between ">

                    <button @click="prompt.processed = false;  " v-if="prompt.processed"
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Edit</button>

                    <button @click="prompt.processed = true; executePrompt(prompt)" v-else
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>


                    <div @click="deletePrompt(prompt.id)"
                        class="cursor-pointer basis-8 text-slate-400 hover:text-red-400 p-1 hover:bg-red-200 rounded-lg">
                        <svg class="svg-icon" viewBox="0 0 20 20" stroke-width="1" stroke="currentColor">
                            <path
                                d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z">
                            </path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>




        <div v-if="prompt.type === 'freestyle'" :id="prompt.id" :key="prompt.id"
            class="prompt absolute  top-0 left-0  flex flex-col flex-wrap transition-shadow p-6 bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200    hover:outline-blue-300 hover:outline  hover:outline-1">

            <div
                class="drag-zone transition-all cursor-pointer opacity-0 hover:opacity-20  h-16 absolute top-0 left-0 w-full bg-blue-200">
            </div>

            <div
                class="output-node w-10 h-10 absolute cursor-pointer -top-5 -right-5 bg-blue-600 rounded-full shadow-lg  shadow-violet-200 hover:shadow-xl">
            </div>

            <div class="content w-72">
                <h1 class="h-14 z-10 font-bold prompt-title">Freestyle Prompt</h1>

                <div v-if="prompt.processed">
                    {{ prompt.response}}
                </div>

                <textarea v-else v-model="prompt.input"
                    class="prompt-example focus:placeholder-transparent w-full transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                    type="text" name="taskExample" rows="5"
                    placeholder="Please generate me some cool ideas for a new website" />

                <div class="controls flex mt-10 items-center justify-between ">

                    <button @click="prompt.processed = false;  " v-if="prompt.processed"
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Edit</button>

                    <button @click="prompt.processed = true; executePrompt(prompt)" v-else
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>


                    <div @click="deletePrompt(prompt.id)"
                        class="cursor-pointer basis-8 text-slate-400 hover:text-red-400 p-1 hover:bg-red-200 rounded-lg">
                        <svg class="svg-icon" viewBox="0 0 20 20" stroke-width="1" stroke="currentColor">
                            <path
                                d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z">
                            </path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>






        <div v-if="prompt.type === 'image'" :id="prompt.id" :key="prompt.id"
            class="prompt absolute  top-0 left-0  flex flex-col flex-wrap transition-shadow p-6 bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200    hover:outline-blue-300 hover:outline  hover:outline-1">

            <div
                class="drag-zone transition-all cursor-pointer opacity-0 hover:opacity-20  h-16 absolute top-0 left-0 w-full bg-blue-200">
            </div>

            <div
                class="output-node w-10 h-10 absolute cursor-pointer -top-5 -right-5 bg-blue-600 rounded-full shadow-lg  shadow-violet-200 hover:shadow-xl">
            </div>

            <div class="content w-72">
                <h1 class="h-14 z-10 font-bold prompt-title">Image Prompt</h1>

                <div  class="rounded-2xl shadow-md shadow-zinc-300 overflow-clip" v-if="prompt.processed">

                    <img class="w-full" :src="prompt.response" alt="Prompt"/>
                </div>
                <textarea v-else v-model="prompt.input"
                    class="prompt-example focus:placeholder-transparen w-full transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                    type="text" rows="6" name="taskExample"
                    placeholder="A beautiful rendering of a crystal clear tropical ocean" />

                <div class="controls flex mt-10 items-center justify-between ">

                    <button @click="prompt.processed = false;  " v-if="prompt.processed"
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Edit</button>

                    <button @click="prompt.processed = true; executePrompt(prompt)" v-else
                        class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>


                    <div @click="deletePrompt(prompt.id)"
                        class="cursor-pointer basis-8 text-slate-400 hover:text-red-400 p-1 hover:bg-red-200 rounded-lg">
                        <svg class="svg-icon" viewBox="0 0 20 20" stroke-width="1" stroke="currentColor">
                            <path
                                d="M10.185,1.417c-4.741,0-8.583,3.842-8.583,8.583c0,4.74,3.842,8.582,8.583,8.582S18.768,14.74,18.768,10C18.768,5.259,14.926,1.417,10.185,1.417 M10.185,17.68c-4.235,0-7.679-3.445-7.679-7.68c0-4.235,3.444-7.679,7.679-7.679S17.864,5.765,17.864,10C17.864,14.234,14.42,17.68,10.185,17.68 M10.824,10l2.842-2.844c0.178-0.176,0.178-0.46,0-0.637c-0.177-0.178-0.461-0.178-0.637,0l-2.844,2.841L7.341,6.52c-0.176-0.178-0.46-0.178-0.637,0c-0.178,0.176-0.178,0.461,0,0.637L9.546,10l-2.841,2.844c-0.178,0.176-0.178,0.461,0,0.637c0.178,0.178,0.459,0.178,0.637,0l2.844-2.841l2.844,2.841c0.178,0.178,0.459,0.178,0.637,0c0.178-0.176,0.178-0.461,0-0.637L10.824,10z">
                            </path>
                        </svg>
                    </div>
                </div>
            </div>
        </div>
















    </div>















    <div class="flex flex-wrap fixed left-10 bottom-10  space-x-2 p-4">
        <button @click='createPrompt("fewshot")'
            class="bg-blue-600 rounded-md shadow-xl shadow-violet-200 text-white p-4 hover:bg-blue-700">Few-shot
            prompt</button>
        <button @click='createPrompt("freestyle")'
            class="bg-blue-600 rounded-md shadow-xl shadow-violet-200 text-white p-4 hover:bg-blue-700">Free prompt</button>
        <button @click='createPrompt("image")'
            class="bg-blue-600 rounded-md shadow-xl shadow-violet-200 text-white p-4 hover:bg-blue-700">Image
            prompt</button>

        <input v-model="apiKey"
            class="prompt-example focus:placeholder-transparent  transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 p-4"
            type="text" name="apiKey" placeholder="Enter your API-key here" />
    </div>
</template>

