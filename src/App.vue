<script>
import { v4 as uuidv4 } from 'uuid';
import interact from 'interactjs'
import { Configuration, OpenAIApi } from 'openai';
import PromptControl from './components/PromptControl.vue';

let id = 0;



export default {

    data() {
        return {
            message: "Hello world!",
            apiKey: '',
            prompts: {},
            canvas: {}
        }
    },
    components: {
        PromptControl
    },


    methods: {


        refreshCanvas() {

            const ctx = this.canvas.getContext("2d");
            ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
            this.drawConnections();
        },

        getOffset(el) {


            const rect = el.getBoundingClientRect();
            return {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                right: rect.right + window.scrollX,
                bottom: rect.bottom + window.scrollY
            };
        },



        initialize() {


            this.canvas = document.querySelector("canvas");
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;


            window.addEventListener('resize', () => {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                this.refreshCanvas()
            });

            interact('.prompt').draggable({
                autoScroll: true,
                ignoreFrom: '.content',
                cursorChecker: () => null,
                listeners: {

                    move: this.onDragPrompt
                }
            });

            interact('.output-node').draggable({
                autoScroll: true,

                cursorChecker: () => null,
                listeners: {
                    end: (event) => {
                        this.refreshCanvas();

                    },
                    move: this.onDragConnector
                }
            });

            interact('.input-node').dropzone({
                accept: '.output-node',
                ondrop: this.onConnectPrompt
            })

        },





        createPrompt(type) {

            let startX = 200 * Math.random();
            let startY = 200 * Math.random();
            let id = uuidv4();
            this.prompts[id] = { id: id, type: type, x: startX, y: startY, isDone: false, isProcessing: false, to: {}, from: {} }
        },

        onDragPrompt(event) {
            var target = event.target

            let x = this.prompts[target.id].x + event.dx
            let y = this.prompts[target.id].y + event.dy

            target.style.transform = 'translate(' + x + 'px, ' + y + 'px)'

            this.prompts[target.id].x = x;
            this.prompts[target.id].y = y;
            this.refreshCanvas();
        },

        onDragConnector(event) {
            let promptID = event.target.parentNode.id;
            let prompt = this.prompts[promptID];

            this.disconnectOutput(prompt);



            this.refreshCanvas();
            let ctx = this.canvas.getContext("2d");
            let rect = this.getOffset(event.target);

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
        },


        isNotEmpty(obj) {
            return Object.keys(obj).length > 0
        },

        disconnectInput(prompt) {

            prompt.from.to = {};
            prompt.from = {};
        },

        disconnectOutput(prompt) {

            prompt.to.from = {};
            prompt.to = {};
        },


        onConnectPrompt(event) {
            let senderPrompt = this.prompts[event.relatedTarget.parentNode.id];
            let receiverPrompt = this.prompts[event.target.parentNode.id];


            let startPrompt = senderPrompt;
            while (this.isNotEmpty(startPrompt.from)) {
                startPrompt = startPrompt.from;
            }

            if (senderPrompt.id !== receiverPrompt.id) {
                if (startPrompt.id !== receiverPrompt.id) {
                    this.disconnectOutput(senderPrompt);
                    this.disconnectInput(receiverPrompt);

                    senderPrompt.to = receiverPrompt
                    receiverPrompt.from = senderPrompt
                }
            }
        },


        deletePrompt(promptID) {
            let prompt = this.prompts[promptID];
            this.disconnectInput(prompt);
            this.disconnectOutput(prompt);

            delete this.prompts[promptID];
        },
        toggleEdit(promptID) {
            let prompt = this.prompts[promptID];
            prompt.isProcessing = false;
            prompt.isDone = false;
        },

        async processPrompt(promptID, messages) {
            let prompt = this.prompts[promptID];

            prompt.isProcessing = true;
            prompt.isDone = false;

            const configuration = new Configuration({ apiKey: this.apiKey });
            delete configuration.baseOptions.headers['User-Agent'];
            const openai = new OpenAIApi(configuration);


            let promptMessages = messages ? [...messages] : [];
            switch (prompt.type) {

                case 'Fewshot':
                    promptMessages.push(
                        { role: "user", content: prompt.exampleTask },
                        { role: "user", content: prompt.exampleAnswer },
                        { role: "user", content: prompt.task }
                    )
                    break;

                case 'Brainstorm':
                    promptMessages.push({
                        role: "user", content: prompt.promptText
                    })

                case 'Logotype':
                    promptMessages.push(
                        { role: "user", content: "A logotype that is" },
                        { role: "user", content: prompt.promptText }
                    )
                    break;


            }

            


            switch (prompt.type) {
                case 'Fewshot':
                case 'Brainstorm': {
                    const completion = await openai.createChatCompletion({
                        model: "gpt-3.5-turbo",
                        messages: promptMessages,
                    });

                    prompt.response = completion.data.choices[0].message.content;
                    promptMessages.push({
                        role: "assistant", content: prompt.response
                    })
                }
                    break;

                case 'Icon':
                case 'Logotype': {

                    let merged = promptMessages.flatMap(pm => pm.message).join(' ');


                    const completion = await openai.createImage({
                        prompt: merged,
                        n: 1,
                        size: "256x256",
                    });

                    prompt.response = completion.data.data[0].url;
                    prompt.isImage = true;
                }

                    break;
            }






            prompt.isProcessing = false;
            prompt.isDone = true;


            if (prompt.to.id in this.prompts) {
                this.processPrompt(prompt.to.id, promptMessages);
            }
        },

        drawConnections() {

            const ctx = this.canvas.getContext("2d");
            for (const [key, value] of Object.entries(this.prompts)) {

                if (this.isNotEmpty(value.to)) {

                    let outputNode = this.getOffset(
                        document.getElementById('output-' + key)
                    );

                    let inputNode = this.getOffset(
                        document.getElementById('input-' + value.to.id)
                    );





                    let y = (outputNode.top + outputNode.bottom) / 2;
                    let x = (outputNode.left + outputNode.right) / 2;
                    let y2 = (inputNode.top + inputNode.bottom) / 2;
                    let x2 = (inputNode.left + inputNode.right) / 2;

                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x2, y2);
                    ctx.lineWidth = 10.0;
                    ctx.lineCap = "round";
                    ctx.strokeStyle = "lightblue"
                    ctx.stroke()
                    ctx.closePath();
                }

            }

        },

        retranslatePrompts() {
            for (var [key, value] of Object.entries(this.prompts)) {
                let el = document.getElementById(key);
                el.style.transform = 'translate(' + value.x + 'px, ' + value.y + 'px)';
            }
        }


    },
    mounted: function () {
        this.initialize();
    }
    ,

    updated: function () {
        this.retranslatePrompts();
        this.refreshCanvas();
    }
}

</script>








<template>
    <div v-for="prompt in prompts">

        <div :id="prompt.id" :key="prompt.id"
            class="prompt absolute top-0 left-0 w-96 bg-white max-w-xs p-4 shadow-xl rounded-xl flex flex-col">
            <div :id="'input-' + prompt.id"
                class="input-node absolute top-3 -left-6 rounded-full bg-gradient-to-t shadow-lg from-green-500 to-green-200 w-8 h-8">

            </div>
            <div :id="'output-' + prompt.id"
                class="output-node absolute top-3 -right-6 rounded-full bg-gradient-to-t shadow-lg from-blue-500 to-cyan-500 w-8 h-8 bg-red-500">

            </div>

            <h1 class="prompt-title text-xl font-extrabold ">
                {{ prompt.type }}
            </h1>


            <div v-if="prompt.isProcessing" class="h-32 justify-center items-center flex">
                <i class="gg-spinner"></i>
            </div>

            <div class="mt-4" v-else-if="prompt.isDone">
                <img v-if="prompt.isImage" class="w-full shadow-md rounded-2xl" :src="prompt.response" />
                <p v-else>{{ prompt.response }}</p>


            </div>

            <div v-else>
                <div class="mt-4" v-if="prompt.type == 'Fewshot'">
                    <input class="prompt-input" type="text" v-model="prompt.exampleTask" placeholder="Prompt" />
                    <input class="prompt-input" type="text" v-model="prompt.exampleAnswer" placeholder="Prompt" />
                    <input class="prompt-input" type="text" v-model="prompt.task" placeholder="Prompt" />
                </div>


                <div class="mt-4" v-else-if="prompt.type == 'Brainstorm'">
                    <input class="prompt-input" type="text" v-model="prompt.promptText" placeholder="Prompt" />
                </div>

                <div class="mt-4" v-else-if="prompt.type == 'Logotype'">
                    <input class="prompt-input" type="text" v-model="prompt.promptText"
                        placeholder="Modern and sleek, bright colors" />
                </div>
            </div>


            <PromptControl @processPrompt="processPrompt" @toggleEdit="toggleEdit" :isDone="prompt.isDone"
                :isProcessing="prompt.isProcessing" :promptID="prompt.id" @deletePrompt="deletePrompt" />
        </div>
    </div>





    <div class="prompt-toolbar flex flex-wrap  sm:flex-row absolute bottom-10 left-10  ">
        <div class='flex  transition-all duration-500 bg-white p-1 sm:p-2 overflow-clip shadow-lg  rounded-xl space-x-2'>
            <button @click="createPrompt('Fewshot')" class="px-3 rounded-md sm:rounded-lg py-1 hover:bg-green-200">
                Fewshot </button>
            <div class="bg-slate-200 w-px "> </div>

            <button @click="createPrompt('Brainstorm')" class="px-3 rounded-md sm:rounded-lg py-1 hover:bg-green-200">
                Brainstorm </button>

            <div class=" bg-slate-200 w-px "> </div>

            <button @click="createPrompt('Logotype')" class="px-3 rounded-md sm:rounded-lg py-1 hover:bg-green-200">
                Logotype </button>

            <div class=" bg-slate-200 w-px "> </div>
            <button @click="createPrompt('Icon')" class="px-3 rounded-md sm:rounded-lg py-1 hover:bg-green-200"> Icon
            </button>

        </div>

        <input v-model="apiKey"
            class='ml-0 mt-3 px-3 py-2  rounded-lg outline-slate-400 outline outline-0 focus:outline-1 focus:bg-white bg-slate-200 text-black  sm:ml-4 sm:py-3 sm:mt-0'
            placeholder='API-key...' />
    </div>
</template>

