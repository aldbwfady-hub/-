
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { IQTestDifficulty, IQTestTopic } from '../types';

// Lazy initialization of the GoogleGenAI instance to prevent app crash on missing API key.
let ai: GoogleGenAI | null = null;

const getAiInstance = (): GoogleGenAI | null => {
    if (ai) {
        return ai;
    }
    // The API key is securely managed as an environment variable.
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        console.error("API_KEY environment variable is not set. The application will not be able to connect to the Gemini API.");
        return null;
    }
    ai = new GoogleGenAI({ apiKey });
    return ai;
};

const API_UNAVAILABLE_MESSAGE = "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يرجى التأكد من أن مفتاح الواجهة البرمجية (API Key) تم إعداده بشكل صحيح.";
const API_UNAVAILABLE_JSON = `{"error": "${API_UNAVAILABLE_MESSAGE}"}`;


export const getChatResponse = async (history: { role: string; parts: { text: string }[] }[], newMessageParts: any[]): Promise<string> => {
  const ai = getAiInstance();
  if (!ai) return API_UNAVAILABLE_MESSAGE;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user', parts: newMessageParts }],
        config: {
          systemInstruction: 'أنت مساعد ذكي وشخصي للطالب. هدفك هو تقديم إجابات مفيدة بطريقة حوارية. يجب عليك دائماً تنسيق إجاباتك باستخدام الماركداون لجعلها منظمة وسهلة القراءة. استخدم العناوين، والنصوص البارزة، والقوائم النقطية والرقمية عند الحاجة.'
        }
    });
    return response.text;
  } catch (error)
 {
    console.error("Error in getChatResponse:", error);
    return "عذراً، حدث خطأ أثناء معالجة طلبك.";
  }
};

export const summarizeText = async (text: string, size: 'short' | 'medium' | 'long', level: 'simple' | 'school' | 'detailed'): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_MESSAGE;
    try {
        const sizeMap = { 'short': 'قصير: زبدة الموضوع في بضع جمل للمراجعة السريعة.', 'medium': 'متوسط: فقرة أو فقرتين تشرح الأفكار الرئيسية.', 'long': 'مفصل: ملخص شامل من عدة فقرات مع الحفاظ على التفاصيل الهامة.' };
        const levelMap = { 
            'simple': 'مبسط: يستخدم لغة سهلة ومباشرة، مناسبة لشرح المفاهيم المعقدة.', 
            'school': 'المستوى المدرسي: يستخدم لغة وأسلوبًا مناسبين للمناهج الدراسية لطلاب المرحلة الإعدادية والثانوية.',
            'detailed': 'أكاديمي: يقدم الملخص بأسلوب رسمي ومنهجي، مناسب للطلاب الجامعيين والتقارير البحثية.' 
        };

        const prompt = `لخص النص التالي بدقة. \n- حجم الملخص المطلوب هو "${sizeMap[size]}" \n- مستوى التعقيد المطلوب هو "${levelMap[level]}" \n\nالنص: \n${text}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error in summarizeText:", error);
        return "عذراً، حدث خطأ أثناء محاولة التلخيص.";
    }
};

export const extractTextFromImage = async (base64Image: string, mimeType: string): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_MESSAGE;
    try {
        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: 'استخرج كل النص المكتوب باللغة العربية من هذه الصورة بدقة. إذا لم يكن هناك نص، أجب بـ "لم يتم العثور على نص".',
        };

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        return response.text;
    } catch (error) {
        console.error("Error in extractTextFromImage:", error);
        return "عذراً، حدث خطأ أثناء قراءة النص من الصورة.";
    }
};

export const generateQuestions = async (
    text: string, 
    questionType: 'mcq' | 'tf' | 'short',
    difficulty: 'easy' | 'medium' | 'hard',
    numQuestions: number
): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_JSON;

    try {
        const typeDescription = {
            mcq: 'أسئلة اختيار من متعدد مع 4 خيارات لكل سؤال.',
            tf: 'أسئلة صح أو خطأ.',
            short: 'أسئلة تتطلب إجابة قصيرة ومباشرة.'
        };

        const difficultyDescription = {
            easy: 'سهل: تركز على المعلومات الأساسية والمباشرة في النص.',
            medium: 'متوسط: تتطلب بعض التحليل والربط بين الأفكار.',
            hard: 'صعب: قد تحتوي على أسئلة استنتاجية أو تتطلب فهمًا عميقًا للمادة.'
        };

        const prompt = `بناءً على النص التالي، قم بإنشاء ${numQuestions} سؤال بالضبط من نوع "${typeDescription[questionType]}" بمستوى صعوبة "${difficultyDescription[difficulty]}".

        النص:
        ${text}`;

        const questionSchema: any = {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING, description: 'نص السؤال' },
                type: { type: Type.STRING, description: `نوع السؤال، يجب أن يكون '${questionType}'` },
            },
            required: ['question', 'type']
        };

        if (questionType === 'mcq') {
            questionSchema.properties.options = { type: Type.ARRAY, items: { type: Type.STRING }, description: 'أربعة خيارات محتملة بالضبط' };
            questionSchema.properties.correctAnswer = { type: Type.STRING, description: 'الإجابة الصحيحة من الخيارات' };
            questionSchema.required.push('options', 'correctAnswer');
        } else if (questionType === 'tf') {
            questionSchema.properties.correctAnswer = { type: Type.BOOLEAN, description: 'الإجابة الصحيحة (true للصح, false للخطأ)' };
            questionSchema.required.push('correctAnswer');
        } else { // short answer
            questionSchema.properties.idealAnswer = { type: Type.STRING, description: 'الإجابة النموذجية القصيرة والمثالية للسؤال' };
            questionSchema.properties.correctAnswer = { type: Type.STRING, description: 'الإجابة النموذجية القصيرة والمثالية للسؤال (مطابقة لـ idealAnswer)' };
            questionSchema.required.push('idealAnswer', 'correctAnswer');
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            items: questionSchema,
                            description: `مصفوفة تحتوي على ${numQuestions} سؤال بالضبط.`
                        }
                    },
                    required: ['questions']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error in generateQuestions:", error);
        return "{\"error\": \"عذراً، حدث خطأ أثناء إنشاء الأسئلة.\"}";
    }
};


export const evaluateShortAnswer = async (userAnswer: string, idealAnswer: string): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_JSON;

    try {
        const prompt = `قارن بين "إجابة الطالب" و "الإجابة النموذجية". قم بتقييم إجابة الطالب من 10 وقدم ملاحظة قصيرة ومفيدة. كن مرناً في التقييم وركز على المعنى وليس على التطابق الحرفي.
        
        الإجابة النموذجية: "${idealAnswer}"
        إجابة الطالب: "${userAnswer}"
        
        أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.NUMBER, description: 'التقييم من 0 إلى 10' },
                        feedback: { type: Type.STRING, description: 'ملاحظة موجزة حول جودة الإجابة (مثل: إجابة صحيحة لكنها غير مكتملة، أو إجابة ممتازة وشاملة)' }
                    },
                    required: ['score', 'feedback']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error in evaluateShortAnswer:", error);
        return "{\"error\": \"عذراً، حدث خطأ أثناء تقييم الإجابة.\", \"score\": 0, \"feedback\": \"خطأ في النظام\"}";
    }
};

export const generateMindMapData = async (
    text: string, 
    density: 'brief' | 'medium' | 'detailed'
): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_JSON;

    try {
        const densityMap = {
            brief: 'موجزة: ركز فقط على الأفكار الرئيسية والعناوين العريضة جدًا. لا تتعمق في التفاصيل.',
            medium: 'متوسطة: تشمل الأفكار الرئيسية مع أهم النقاط الفرعية التابعة لها. هذا هو الخيار المتوازن.',
            detailed: 'مفصلة: تعمق في التفاصيل وأضف أكبر عدد ممكن من الفروع والنقاط الفرعية ذات الصلة من النص.'
        };

        const prompt = `بناءً على النص التالي، قم بإنشاء هيكل لخريطة ذهنية. الفكرة الرئيسية يجب أن تكون الجذر. يجب أن تكون كثافة الخريطة "${densityMap[density]}". 
        
        النص:
        ${text}
        
        أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي أو علامات markdown.`;

        const nodeSchema: any = {
            type: Type.OBJECT,
            properties: {
                topic: { type: Type.STRING, description: 'نص العقدة (الفكرة).' },
            },
            required: ['topic'],
        };
        // FIX: Correctly define the recursive schema for the mind map nodes.
        // The original implementation was buggy and did not create a truly recursive structure.
        nodeSchema.properties.children = { type: Type.ARRAY, items: nodeSchema };

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING, description: 'الفكرة الرئيسية للنص.' },
                        children: {
                            type: Type.ARRAY,
                            items: nodeSchema,
                            description: 'المواضيع الفرعية المتفرعة من الفكرة الرئيسية.'
                        }
                    },
                    required: ['topic']
                }
            }
        });

        return response.text;
    } catch (error) {
        console.error("Error in generateMindMapData:", error);
        return "{\"error\": \"عذراً، حدث خطأ أثناء إنشاء الخريطة الذهنية.\"}";
    }
};

export const generateExamples = async (text: string): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_MESSAGE;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `بناءً على النص التالي، قدم 3 أمثلة عملية أو توضيحية تساعد على فهم الموضوع بشكل أفضل. اجعل الأمثلة واضحة ومناسبة للطلاب. النص: \n\n${text}`
        });
        return response.text;
    } catch (error) {
        console.error("Error in generateExamples:", error);
        return "عذراً، حدث خطأ أثناء إنشاء الأمثلة.";
    }
};

export const generateSpeech = async (text: string, voice: 'male' | 'female'): Promise<string | null> => {
    const ai = getAiInstance();
    if (!ai) return null;

    try {
        const voiceName = voice === 'male' ? 'Kore' : 'Puck'; // Kore for male, Puck for female
         const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;
    } catch (error) {
        console.error("Error in generateSpeech:", error);
        return null;
    }
};

export const generateIQTest = async (
    topic: IQTestTopic,
    difficulty: IQTestDifficulty,
    numQuestions: number
): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return API_UNAVAILABLE_JSON;

    const topicMap = {
        general: 'أسئلة ذكاء عامة ومتنوعة',
        logic: 'أسئلة تركيز على المنطق والاستنتاج وحل المشكلات',
        math: 'أسئلة تركيز على الأنماط العددية والمتسلسلات الرياضية',
        spatial: 'أسئلة تركيز على التفكير البصري والمكاني وتدوير الأشكال'
    };
     const difficultyMap = {
        easy: 'سهل: أسئلة مباشرة تتطلب تفكيرًا سريعًا وبسيطًا',
        medium: 'متوسط: أسئلة تتطلب درجة أعلى من التحليل والربط بين الأفكار',
        hard: 'صعب: أسئلة معقدة تتطلب تفكيرًا عميقًا وغير تقليدي'
    };

    const prompt = `
    أنشئ اختبار ذكاء (IQ test) مكون من ${numQuestions} سؤال بالضبط.
    - موضوع الأسئلة: ${topicMap[topic]}.
    - مستوى الصعوبة: ${difficultyMap[difficulty]}.
    
    كل سؤال يجب أن يحتوي على:
    1. نص السؤال (question).
    2. أربعة خيارات (options) بالضبط.
    3. الإجابة الصحيحة (correctAnswer) من ضمن الخيارات.
    
    يجب أن تكون الأسئلة فريدة ومبتكرة ومناسبة للمستوى المطلوب.
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            description: `مصفوفة تحتوي على ${numQuestions} سؤال بالضبط`,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING, description: 'نص السؤال' },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'أربعة خيارات بالضبط' },
                                    correctAnswer: { type: Type.STRING, description: 'الإجابة الصحيحة من ضمن الخيارات' }
                                },
                                required: ['question', 'options', 'correctAnswer']
                            }
                        }
                    },
                    required: ['questions']
                }
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error in generateIQTest:", error);
        return "{\"error\": \"عذراً، حدث خطأ أثناء إنشاء الاختبار. حاول مجدداً.\"}";
    }
};

export const getIQTestFeedback = async (
    score: number,
    total: number,
    topic: IQTestTopic,
    difficulty: IQTestDifficulty
): Promise<string> => {
    const ai = getAiInstance();
    if (!ai) return "أداء رائع! استمر في تحدي عقلك."; // Return a default positive message.

    const prompt = `
    طالب حصل على نتيجة ${score} من ${total} في اختبار ذكاء.
    - موضوع الاختبار كان: "${topic}".
    - مستوى الصعوبة كان: "${difficulty}".

    اكتب له رسالة تقييم شخصية قصيرة (جملتين أو ثلاث) ومحفزة.
    - إذا كانت النتيجة عالية، امدح ذكاءه ومهاراته.
    - إذا كانت متوسطة، قل أنها نتيجة جيدة جداً وتشير لذكاء فوق المتوسط.
    - إذا كانت منخفضة، شجعه على أن هذه مجرد بداية وأن التدريب والممارسة يصنعان الفارق ولا تدعه يحبط.
    
    كن إيجابياً ومحفزاً دائماً.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text;
    } catch (error) {
        console.error("Error generating feedback:", error);
        return "أداء رائع! استمر في تحدي عقلك.";
    }
};