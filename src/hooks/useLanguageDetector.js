import { useState } from "react"

let LanguageDetector;

const getLanguageDetector = async () => {
    if (!LanguageDetector) {
        const languageDetectorCapabilities = await window.ai.languageDetector.capabilities();
        const canDetect = languageDetectorCapabilities.available;

        if (canDetect === 'no') {
            // The language detector isn't usable.
            throw new Error("Language Detector isnt usable")
        }
        if (canDetect === 'readily') {
            // The language detector can immediately be used.
            LanguageDetector = await window.ai.languageDetector.create();
        } else {
            // The language detector can be used after model download.
            LanguageDetector = await window.ai.languageDetector.create();
            await detector.ready;
        }
    }

    return LanguageDetector
}

const tryLanguageDetection = async (message) => {
    if (!('ai' in self && 'languageDetector' in self.ai)) {
        throw new Error("Language Detection not supported")
    }

    const languageDetector = await getLanguageDetector();
    const results = await languageDetector.detect(message);
    // get the best match based on confidence
    return results.sort((a, b) => b.confidence - a.confidence)[0].detectedLanguage;
}

export const useLanguageDetector = () => {
    const [detecting, setDetecting] = useState(false);

    const detectLanguage = async (message) => {
        setDetecting(true);
        try {
            return await tryLanguageDetection(message)
        } finally {
            setDetecting(false)
        }
    }

    return {
        detectLanguage,
        detecting,
    }
}