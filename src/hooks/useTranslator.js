import { useState } from "react"

let Translators = {};

const translatorSupported = () => 'ai' in self && 'translator' in self.ai;

const getTranslator = async (source, target) => {
    const translatorKey = `${source}/${target}`;
    if (!Translators[translatorKey] && translatorSupported()) {
        const capabilities = await window.ai.translator.capabilities();
        const available = capabilities.languagePairAvailable(source, target);

        if (available === 'no') {
            // The Translator API isn't usable.
            throw new Error(`Translator for ${source}/${target} language pair is not usable`)
        }
        if (available === 'readily') {
            // The Translator API can be used immediately .
            Translators[translatorKey] = await self.ai.translator.create({
                sourceLanguage: source,
                targetLanguage: target,
            });
        } else {
            // The Translator API can be used after the model is downloaded.
            Translators[translatorKey] = await self.ai.translator.create({
                sourceLanguage: source,
                targetLanguage: target,
            });
            await Translators[translatorKey].ready;
        }
    }

    return Translators[translatorKey]
}


export const useTranslator = () => {
    const [translating, setTranslating] = useState(false);

    const translate = async (source, target, message) => {
        setTranslating(true)
        try {
            const translator = await getTranslator(source, target);
            return await translator.translate(message)
        } finally {
            setTranslating(false)
        }
    }

    return {
        translate,
        translating,
    }
}