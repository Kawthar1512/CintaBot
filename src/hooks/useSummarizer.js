import { useState } from "react"

const options = {
    type: 'tl;dr',
    format: 'plain-text',
    length: 'short',
};

let Summarizer;

const getSummarizer = async () => {
    if (!Summarizer && "ai" in window) {
        const available = (await window.ai.summarizer.capabilities()).available;
        if (available === 'no') {
            // The Summarizer API isn't usable.
            throw new Error("Summarizer not available")
        }
        if (available === 'readily') {
            // The Summarizer API can be used immediately .
            Summarizer = await self.ai.summarizer.create(options);
        } else {
            // The Summarizer API can be used after the model is downloaded.
            Summarizer = await self.ai.summarizer.create(options);
            await Summarizer.ready;
        }
    }

    return Summarizer
}


export const useSummarizer = () => {
    const [summarizing, setSummarizing] = useState(false);

    const summarize = async (message) => {
        setSummarizing(true)
        try {
            const summarizer = await getSummarizer();
            return await summarizer.summarize(message)
        } finally {
            setSummarizing(false)
        }
    }

    return {
        summarize,
        summarizing,
    }
}