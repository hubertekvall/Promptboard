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
                'Persona': async function (prompt) {
                    const personaText = await self.getChatCompletion(prompt, `Generate a persona based on our chat that is ${prompt.promptModifier}, be terse and short and be inspired by our chat. Only include name, age, occupation, background, goals and motivations, interests and challenges. Output each header as an html list , put each header in a <strong> tag`);
                    const [url, imagePrompt] = await self.getImageGeneration(prompt, "Describe an image of this persona in text form. Be terse and short");
                    prompt.imagePrompt = imagePrompt;
                    prompt.imageURL = url;
                    prompt.response = personaText;
                },

                'Brainstorm': async function (prompt) {
                    let brainstorm = "";

                    if (prompt.messages.length > 0) brainstorm = await self.getChatCompletion(prompt, `Brainstorm ideas based on our chat that is about ${prompt.promptModifier}, be terse and short and be inspired by our chat. Output each header as an html list, put each header in a <strong> tag`);
                    else brainstorm = await self.getChatCompletion(prompt, `Brainstorm ideas about ${prompt.promptModifier}, be terse and short. Output each header as an html list, put each header in a <strong> tag`);

                    prompt.response = brainstorm;
                },

                'How might we': async function (prompt) {
                    const prefix = `This is our problem statement: ${prompt.user} needs to ${prompt.userNeed} because ${prompt.insight}, break it down into actionable pieces`;
                    const actionablePieces = await self.getChatCompletion(prompt, prefix);

                    const howMightWe = await self.getChatCompletion(prompt, "Reframe these actionable pieces into questions in this format:\nHow might we [intended experience] for [user] so that [desired effect]? \n Output each How-might-we question as an HTML list element")

                    prompt.response = howMightWe;
                },

                'Roleplay': async function (prompt) {
                    const characterPrefix = `Consider our chat history and generate a character whose name is ${prompt.roleName}, the character's personality is ${prompt.rolePersonality}, a unique trait of the character is ${prompt.roleTrait}, the character's purpose is to ${prompt.rolePurpose}, be inspired by our chat history, be terse and short`;
                    const characterText = await self.getChatCompletion(prompt, characterPrefix);
                    const [url, imagePrompt] = await self.getImageGeneration(prompt, "Describe an image of this character in text form. Be terse and short");
                    prompt.imagePrompt = imagePrompt;
                    prompt.imageURL = url;
                    prompt.characterText = characterText;

                    const prefix = "You will now enter the role as " + prompt.roleName + ", here's an example of how your character should behave when conversating: \n" +
                        "User: " + prompt.exampleTask + "\n" +
                        prompt.roleName + ": " + prompt.exampleAnswer + "\n\n" +
                        "From now on you will remain in character as " + prompt.roleName + "\n" +
                        "You will answer every question like this: " + "\n" +
                        prompt.roleName + ": [The way " + prompt.roleName + " would talk]";

                    const response = await self.getChatCompletion(prompt, prefix);

                    prompt.response = response;
                },

                'Instruction': async function (prompt) {
                    const prefix = "Follow my instructions, here's an example of how your should behave when conversating: \n" +
                        + prompt.exampleTask + "\n" +
                          prompt.exampleAnswer + "\n" +
                          prompt.task;

                    const instruction = await self.getChatCompletion(prompt, prefix);
                    prompt.response = instruction;
                },

                'Chat': async function (prompt) {
                    await self.getChatCompletion(prompt, prompt.reply);
                    prompt.visibleMessages.push(prompt.messages.at(-2), prompt.messages.at(-1));
                }
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

            console.log("User: " + prefix);
            console.log("Assistant: " + prompt.messages.at(-1).content);
            console.log(prompt.messages);
            return response;
        },

        async getImageGeneration(prompt, prefix) {
            const openai = this.getOpenAIConfiguration();

            if (prefix) {
                await this.getChatCompletion(prompt, prefix);
            }

            const imagePrompt = prompt.messages.at(-1).content;
            console.log("Image prompt: " + imagePrompt);
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
                process: this.processMethods[type],
                promptModifier: '',
                reply: '',
                x: startX,
                y: startY,
                isDone: false,
                isProcessing: false,
                messages: [],
                visibleMessages: [],
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
                if (receiverPrompt.from !== null) this.removeConnector(receiverPrompt.from, receiverPrompt);
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






        async processPrompt(promptID, keepMessages) {
            let prompt = this.prompts[promptID];

            prompt.isProcessing = true;
            prompt.isDone = false;



            if (!keepMessages || prompt.messages.length == 0) {
                prompt.messages = [];
                prompt.visibleMessages = [];

                if (prompt.from !== null) {
                    prompt.messages = prompt.from.messages.slice();
                }
            }


            await prompt.process(prompt, keepMessages);

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
            class="prompt absolute  top-0 left-0  bg-white p-4 shadow-xl rounded-xl flex flex-col">



            <div :class="[dragging || prompt.from !== null ? 'bg-lime-600' : 'bg-slate-400']" :id="'input-' + prompt.id"
                class="input-node transition-all duration-500 absolute top-10 -left-8 rounded-full shadow-lg  w-8 h-8">
            </div>
            <div :id="'output-' + prompt.id"
                class="output-node absolute top-10 -right-8 rounded-sm shadow-lg bg-blue-500 to-blue-400 w-8 h-8">
            </div>
            <div class="flex mb-4 items-center justify-between">
                <h1 class="prompt-title  text-blue-600 text-lg font-extrabold ">
                    {{ prompt.type }}
                </h1>
                <button class="rounded-lg p-4   font-bold text-zinc-500 bg-slate-200 hover:bg-blue-500 hover:text-white"
                    @click="(e) => prompt.minimized = !prompt.minimized"><i class="gg-minimize"></i></button>
            </div>


            <div :class="[prompt.minimized ? 'hidden' : 'visible', prompt.showHistory ? 'opacity-20' : 'opacity-100']"
                class="prompt-inner ">


                <div v-if="prompt.isProcessing && prompt.type !== 'Chat'"
                    class="h-32 w-96 justify-center items-center flex">
                    <i class="gg-spinner"></i>
                </div>


                <div v-else>
                    <div v-if="prompt.type == 'Persona'">

                        <div class="space-y-8 w-96 flex flex-col items-center" v-if="prompt.isDone">
                            <div><img :src="prompt.imageURL" class="rounded-full shadow-lg" /></div>
                            <p class="text-xs overflow-y-scroll  space-y-2 max-h-20  rounded-xl bg-slate-50 p-4">“{{
                                prompt.imagePrompt }}”</p>

                            <div v-html="prompt.response"
                                class="overflow-y-scroll  space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>
                        </div>

                        <div class="w-96 mt-4" v-else="prompt.isDone">
                            <input class="prompt-input" type="text" v-model="prompt.promptModifier"
                                placeholder="Describe something about the persona" />
                        </div>
                    </div>


                    <div v-else-if="prompt.type == 'Brainstorm'" class="space-y-8  w-96 items-center flex flex-col">

                        <div v-if="prompt.isDone">
                            <div v-if="prompt.isDone" v-html="prompt.response"
                                class=" w-full overflow-y-scroll space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>
                        </div>

                        <div class="w-96 mt-4" v-else>
                            <input class="prompt-input" type="text" v-model="prompt.promptModifier"
                                placeholder="Topic, theme or anything to brainstorm about" />
                        </div>
                    </div>
                    <div v-else-if="prompt.type == 'Instruction'" class="space-y-8  w-96 items-center flex flex-col">

                        <div v-if="prompt.isDone">
                            <div v-if="prompt.isDone" v-html="prompt.response"
                                class=" w-96 overflow-y-scroll space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>
                        </div>

                        <div class="w-96 mt-4" v-else>
                            <input class="prompt-input" type="text" v-model="prompt.exampleTask"
                                placeholder="Example of a task" />
                            <input class="prompt-input" type="text" v-model="prompt.exampleAnswer"
                                placeholder="Example of an answer" />
                            <input class="prompt-input" type="text" v-model="prompt.task"
                                placeholder="Your request" />

                        </div>
                    </div>


                    <div v-else-if="prompt.type == 'How might we'" class="space-y-8  w-96 flex flex-col">

                        <div v-if="prompt.isDone">
                            <div v-if="prompt.isDone" v-html="prompt.response"
                                class=" w-96 overflow-y-scroll space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>
                        </div>

                        <div v-else class="flex flex-col">

                            <input class="prompt-input " type="text" v-model="prompt.user" placeholder="User" />
                            <input class="prompt-input " type="text" v-model="prompt.userNeed" placeholder="Need" />
                            <input class="prompt-input " type="text" v-model="prompt.insight" placeholder="Insight" />

                        </div>
                    </div>


                    <div v-else-if="prompt.type == 'Roleplay'" class="space-y-8  w-96  flex flex-col">

                        <div class="space-y-4 flex flex-wrap justify-center" v-if="prompt.isDone">
                            <div class="w-56">
                                <img :src="prompt.imageURL" class="rounded-full shadow-lg" />
                            </div>
                            <div class="text-xs h-16 overflow-y-scroll">“{{ prompt.imagePrompt }}”</div>

                            <div v-html="prompt.characterText"
                                class="overflow-y-scroll  space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>

                            <div v-html="prompt.response"
                                class="overflow-y-scroll  space-y-2 max-h-64 text-sm rounded-xl bg-slate-50 p-4">
                            </div>
                        </div>

                        <div class="w-96 mt-4" v-else>
                            <input class="prompt-input" type="text" v-model="prompt.roleName"
                                placeholder="Name of character" />

                            <input class="prompt-input mt-4" type="text" v-model="prompt.rolePersonality"
                                placeholder="Personality" />
                            <input class="prompt-input " type="text" v-model="prompt.roleTrait"
                                placeholder="What's something unique about the character?" />

                            <input class="prompt-input" type="text" v-model="prompt.rolePurpose"
                                placeholder="What does the character do?" />

                            <h1 class="mt-8 text-slate-600 text-lg font-normal">Example scenario</h1>
                            <input class="mt-2 prompt-input" type="text" v-model="prompt.exampleTask"
                                placeholder="Input from the user" />
                            <input class="prompt-input" type="text" v-model="prompt.exampleAnswer"
                                placeholder="How should the character react?" />

                        </div>
                    </div>




                    <div v-else-if="prompt.type == 'Chat'" class="space-y-8  w-96 items-center flex flex-col">
                        <div
                            class="h-96 w-96 p-2 rounded-xl snap-y snap-proximity bg-slate-50  flex flex-col overflow-y-scroll">
                            <ul style="list-style-type: none;">
                                <div v-for="message in prompt.visibleMessages">
                                    <li v-if="message.role === 'user'" class="mt-4 text-sm bg-blue-200 p-2 rounded-md"
                                        v-html="message.content"></li>
                                    <li v-else class="text-sm mt-4 bg-slate-200 p-2 rounded-md" v-html="message.content">
                                    </li>
                                </div>
                                <li v-if="prompt.isProcessing" class="snap-end p-6 rounded-lg flex justify-center"> <i
                                        class="gg-spinner"></i></li>
                            </ul>


                        </div>
                        <input class="prompt-input" type="text" v-model="prompt.reply" placeholder="Your answer" />
                    </div>




                </div>

            </div>

            <div class="flex  justify-between items-end ">
                <div v-if="prompt.type == 'Chat'" class='mt-8 flex space-x-2 justify-between items-center'>
                    <button @click="processPrompt(prompt.id, true)"
                        class='rounded-lg p-2 px-4  text-white bg-blue-600 hover:bg-blue-500'>Reply</button>

                    <button @click="deletePrompt(prompt.id)"
                        class='rounded-lg font-bold p-2 bg-slate-100 text-slate-400 hover:bg-red-500 hover:text-red-100'>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13H16C16.5523 13 17 12.5523 17 12C17 11.4477 16.5523 11 16 11H8Z"
                                fill="currentColor" />
                            <path fill-rule="evenodd" clip-rule="evenodd"
                                d="M1 5C1 2.79086 2.79086 1 5 1H19C21.2091 1 23 2.79086 23 5V19C23 21.2091 21.2091 23 19 23H5C2.79086 23 1 21.2091 1 19V5ZM5 3H19C20.1046 3 21 3.89543 21 5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3Z"
                                fill="currentColor" />
                        </svg>
                    </button>
                </div>

                <PromptControl v-else @processPrompt="processPrompt" @toggleEdit="toggleEdit" :isDone="prompt.isDone"
                    :isProcessing="prompt.isProcessing" :promptID="prompt.id" @deletePrompt="deletePrompt" />
                <button @click="(e) => prompt.showHistory = !prompt.showHistory"
                    class='ml-2 rounded-lg p-3 px-5  bg-slate-200 text-slate-400 hover:bg-blue-600 hover:text-red-100'><i
                        class="gg-readme"></i></button>

            </div>

            <div v-if="!prompt.minimized"
                :class="[prompt.showHistory ? 'h-96' : 'h-0', prompt.showHistory ? 'opacity-100' : 'opacity-0']"
                class="absolute flex flex-col  transition-all text-zinc-600 p-4 bg-slate-200 w-96 bottom-1/3   rounded-lg ">
                <div class=" bg-zinc-50  h-full rounded-md overflow-y-scroll ">
                    <ul style="list-style-type:none;" class="py-4 " v-for="message in prompt.messages">
                        <li v-if="message.role === 'user'" class=" text-sm bg-blue-200 p-2 rounded-md"
                            v-html="message.content"></li>
                        <li v-else class="text-sm  bg-slate-200 p-2 rounded-md" v-html="message.content"></li>
                    </ul>
                </div>
            </div>
        </div>

    </div>





    <div class="prompt-toolbar flex flex-wrap  sm:flex-row absolute bottom-10 left-10  ">
        <div class='flex transition-all duration-500   font-normal overflow-clip space-x-2'>
            <div v-for="(value, key) in processMethods">
                <button @click="createPrompt(key)"
                    class=" transition-all px-3 bg-blue-600 text-white rounded-md sm:rounded-lg py-3 shadow-md hover:bg-blue-500">
                    {{ key }} </button>
                <div class="bg-slate-600 w-px "> </div>
            </div>
        </div>

        <input v-model="apiKey"
            class=' px-3   rounded-lg outline-slate-400 outline outline-0 focus:outline-1 focus:bg-white bg-slate-200 text-black  sm:ml-4 sm:py-3 sm:mt-0'
            placeholder='API-key...' />
    </div>
</template>

