<script>


export default {
    props: {
        title: String
    }
}
</script>



<template>
    <div
        class="absolute prompt top-0 left-0  flex flex-col flex-wrap transition-shadow p-6 bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200    hover:outline-blue-300 hover:outline  hover:outline-1">

        <div
            class="drag-zone transition-all cursor-pointer opacity-0 hover:opacity-20  h-16 absolute top-0 left-0 w-full bg-blue-200">
        </div>

        <div
            class="output-node w-10 h-10 absolute cursor-pointer -top-5 -right-5 bg-blue-600 rounded-full shadow-lg  shadow-violet-200 hover:shadow-xl">
        </div>

        <div class="content w-72">
            <h1 class="h-14 z-10 font-bold prompt-title">{{ title }}</h1>

            <input
                class="prompt-example focus:placeholder-transparent  transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                type="text" name="taskExample" placeholder="French: Bonjour" />
            <input
                class="mt-4 focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2 "
                type="text" name="answerExample" placeholder="English: Good day" />
            <input
                class="mt-4  focus:placeholder-transparent transition-all duration-300 border border-l-0 border-r-0 outline-0 border-t-0 border-slate-200 focus:border-slate-400 py-2"
                type="text" name="task" placeholder="French: Sacre bleu!" />


            <div class="controls flex mt-10 items-center justify-between ">
                <button class="py-3 px-5 font-semibold rounded-md bg-blue-600 text-white">Process</button>


                <div @click="$emit('delete-me')"
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
</template>