<script>
export default {
    data() {
        return {
            message: "Hello world!"
        }
    }
}
</script>

<template>
    <div
        class="prompt flex flex-col  transition-shadow bg-white  rounded-xl shadow-lg  shadow-violet-200 hover:shadow-xl hover:shadow-violet-200  p-6 absolute hover:outline-blue-300 hover:outline  hover:outline-1">

        <div class="w-72">
            <h1 class="font-bold">Few-shot prompt</h1>
            <!-- Inputs -->
            <input
                class="mt-10 w-full focus:placeholder-transparent transition-all duration-300 rounded-md border-0 outline-0 py-2"
                type="text" placeholder="French: Bonjour" />
            <input
                class="mt-4 w-full focus:placeholder-transparent transition-all duration-300 rounded-md border-0 outline-0  hover:bg-slate-50  focus:bg-slate-100 py-2 "
                type="text" placeholder="English: Good day" />
            <input
                class="mt-4 w-full focus:placeholder-transparent transition-all duration-300 rounded-md border-0 outline-0  hover:bg-slate-50 focus:bg-slate-100 py-2"
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

</div></template>

