import { useState } from "react"

let Assistant;

const getAssistant = async () => {
    if (!Assistant && "ai" in window) {
        Assistant = await window.ai.languageModel.create({ systemPrompt: "You are a helpful conversational assistant" });
    }
    return Assistant
}


export const usePrompt = () => {
    const [prompting, setPrompting] = useState(false);

    const prompt = async (message) => {
        setPrompting(true)
        try {
            const assistant = await getAssistant();
            return await assistant.prompt(message)
        } finally {
            setPrompting(false)
        }
    }

    return {
        prompt,
        prompting,
    }
}