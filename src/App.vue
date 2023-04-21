<script>
import { v4 as uuidv4 } from 'uuid';
import interact from 'interactjs'
import { Configuration, OpenAIApi } from 'openai';
import PromptControl from './components/PromptControl.vue';


let id = 0;


export default {

    data() {
        const self = this;

        return {
            message: "Hello world!",
            apiKey: '',
            prompts: {},
            canvas: {},

            processMethods: {
                'Persona': {
                    method: async function (prompt) {
                        const personaText = await self.getChatCompletion(prompt, `Generate a persona that is ${prompt.promptModifier}, be terse and short. Only include name, age, occupation, background, goals and motivations, interests and challenges. Output each header as an html list , put each header in a <strong> tag`);
                        const [url, imagePrompt] = await self.getImageGeneration(prompt, "Generate an image prompt for this persona");

                        console.log(prompt.messages);

                        prompt.imagePrompt = imagePrompt;
                        prompt.imageURL = url;
                        prompt.response = personaText;
                    },
                  

                },

                'Brainstorm': function () {

                },

                'How might we': function () {

                },

                'Assistant persona': function () {

                },
            },
            dragging: false
        }
    },
    components: {
        PromptControl
    },


    methods: {
        async getChatCompletion(prompt, prefix) {
            const openai = this.getOpenAIConfiguration();

            if (prefix) {
                prompt.messages.push({
                    role: "user", content: prefix
                });
            }

            const completion = await openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages: prompt.messages,
            });

            const response = completion.data.choices[0].message.content
            prompt.messages.push({ role: "assistant", content: response });
            return response;
        },

        async getImageGeneration(prompt, prefix) {
            const openai = this.getOpenAIConfiguration();

            if (prefix) {
                await this.getChatCompletion(prompt, prefix);
            }

            const imagePrompt = prompt.messages.at(-1).content;

            const completion = await openai.createImage({
                prompt: prompt.messages.at(-1).content,
                n: 1,
                size: "256x256",
            });

            return [completion.data.data[0].url, imagePrompt];
        },

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
                ignoreFrom: '.prompt-inner',
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
                        this.dragging = false;
                    },
                    move: this.onDragConnector
                }
            });


            interact('.input-node').draggable({
                autoScroll: true,

                cursorChecker: () => null,
                listeners: {
                    end: (event) => {
                        this.onRemoveConnector(event);
                        this.refreshCanvas();
                    },
                }
            });


            interact('.input-node').dropzone({
                accept: '.output-node',
                ondrop: this.onConnectPrompt
            });

        },





        createPrompt(type) {

            let startX = 200 * Math.random();
            let startY = 200 * Math.random();
            let id = uuidv4();
            this.prompts[id] = {
                id: id,
                type: type,
                process: this.processMethods[type].method,
                promptText: this.processMethods[type].promptText,
                x: startX,
                y: startY,
                isDone: false,
                isProcessing: false,
                messages: [],
                to: [],
                from: null
            }
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
            this.dragging = true;
            let promptID = event.target.parentNode.id;
            let prompt = this.prompts[promptID];

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

        onConnectPrompt(event) {
            let senderPrompt = this.prompts[event.relatedTarget.parentNode.id];
            let receiverPrompt = this.prompts[event.target.parentNode.id];


            // Walk the chain
            let startPrompt = senderPrompt;
            while (startPrompt.from !== null) {
                startPrompt = startPrompt.from;
            }


            // Can't connect to a cycle or the same prompt
            if (senderPrompt.id !== receiverPrompt.id && startPrompt.id !== receiverPrompt.id) {
                senderPrompt.to.push(receiverPrompt);
                receiverPrompt.from = senderPrompt
            }
        },
        onRemoveConnector(event) {
            let inputNode = this.prompts[event.target.parentNode.id];

            if (inputNode.from !== null) {
                this.removeConnector(inputNode.from, inputNode);
            }
        },


        disconnectInput(prompt) {
            if (prompt.from !== null) {
                this.removeConnector(prompt.from, prompt);
            }
        },

        disconnectOutputs(prompt) {
            prompt.to.forEach(element => {
                element.from = null;
            });

            prompt.to = [];
        },
        removeConnector(from, to) {
            from.to = from.to.filter((p) => p.id !== to.id);
            to.from = null;
        },







        deletePrompt(promptID) {
            let prompt = this.prompts[promptID];
            this.disconnectInput(prompt);
            this.disconnectOutputs(prompt);

            delete this.prompts[promptID];
        },



        toggleEdit(promptID) {
            let prompt = this.prompts[promptID];
            prompt.isProcessing = false;
            prompt.isDone = false;
        },






        getOpenAIConfiguration() {
            const configuration = new Configuration({ apiKey: this.apiKey });
            delete configuration.baseOptions.headers['User-Agent'];
            return new OpenAIApi(configuration);
        },





        async processPrompt(promptID) {
            let prompt = this.prompts[promptID];

            prompt.isProcessing = true;
            prompt.isDone = false;

            if (prompt.from !== null) {
                prompt.messages = from.messages.slice();
            }
            else {
                prompt.messages = []
            }

            console.log(prompt.messages);

            await prompt.process(prompt);


            prompt.isProcessing = false;
            prompt.isDone = true;


            prompt.to.forEach(element => {
                this.processPrompt(element.id);
            });
        },
















        drawConnections() {

            const ctx = this.canvas.getContext("2d");
            for (const [key, value] of Object.entries(this.prompts)) {


                let outputNode = this.getOffset(
                    document.getElementById('output-' + key)
                );
                value.to.forEach(element => {
                    let inputNode = this.getOffset(
                        document.getElementById('input-' + element.id)
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
                });
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
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const key = urlParams.get('apiKey');
        this.apiKey = key;
    },

    updated: function () {
        this.retranslatePrompts();
        this.refreshCanvas();
    }
}

</script>








<template>
    <div v-for="prompt in prompts">

        <div :id="prompt.id" :key="prompt.id"
            class="prompt absolute top-0 left-0 max-w-xl bg-white p-4 shadow-xl rounded-xl flex flex-col">
            <div :class="[dragging || prompt.from !== null ? 'bg-green-500' : 'bg-slate-400']" :id="'input-' + prompt.id"
                class="input-node transition-all duration-500 absolute top-3 -left-6 rounded-full shadow-lg  w-8 h-8">

            </div>
            <div :id="'output-' + prompt.id"
                class="output-node absolute top-3 -right-6 rounded-full shadow-lg bg-blue-500 to-blue-400 w-8 h-8">
            </div>

            <h1 class="prompt-title text-xl font-extrabold ">
                {{ prompt.type }}
            </h1>

            <div class="prompt-inner transition-all duration-500">
                <div v-if="prompt.isProcessing" class="h-32 justify-center items-center flex">
                    <i class="gg-spinner"></i>

                </div>



                <div v-else class="transition-all">
                    <div class="mt-4" v-if="prompt.isDone">
                        <div v-if="prompt.type == 'Persona'" class="space-y-8  items-center flex flex-col">
                            <img :src="prompt.imageURL" class="rounded-full shadow-lg" />
                            <p class="text-xs w-96">“{{ prompt.imagePrompt }}”</p>

                            <div v-html="prompt.response"
                                class="overflow-y-scroll  space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">

                            </div>
                        </div>
                    </div>

                    <div v-else>
                        <div class="w-96 mt-4" v-if="prompt.type == 'Persona'">

                            <input class="prompt-input" type="text" v-model="prompt.promptModifier"
                                placeholder="Describe something short that defines your persona" />

                        </div>
                    </div>



                    <!-- <div class="mt-4" v-else-if="prompt.type == 'Brainstorm'">
                                                                            <input class="prompt-input" type="text" v-model="prompt.promptText" placeholder="Prompt" />
                                                                        </div>

                                                                        <div class="mt-4" v-else-if="prompt.type == 'Logotype'">
                                                                            <input class="prompt-input" type="text" v-model="prompt.promptText"
                                                                                placeholder="Modern and sleek, bright colors" />
                                                                        </div> -->
                </div>
            </div>


            <PromptControl @processPrompt="processPrompt" @toggleEdit="toggleEdit" :isDone="prompt.isDone"
                :isProcessing="prompt.isProcessing" :promptID="prompt.id" @deletePrompt="deletePrompt" />
        </div>
    </div>





    <div class="prompt-toolbar flex flex-wrap  sm:flex-row absolute bottom-10 left-10  ">
        <div class='flex  transition-all duration-500 bg-white p-1 sm:p-2 overflow-clip shadow-lg  rounded-xl space-x-2'>
            <div v-for="(value, key) in processMethods">
                <button @click="createPrompt(key)" class="px-3 rounded-md sm:rounded-lg py-1 hover:bg-green-200">
                    {{ key }} </button>
                <div class="bg-slate-200 w-px "> </div>
            </div>
        </div>

        <input v-model="apiKey"
            class='ml-0 mt-3 px-3 py-2  rounded-lg outline-slate-400 outline outline-0 focus:outline-1 focus:bg-white bg-slate-200 text-black  sm:ml-4 sm:py-3 sm:mt-0'
            placeholder='API-key...' />
    </div>
</template>

