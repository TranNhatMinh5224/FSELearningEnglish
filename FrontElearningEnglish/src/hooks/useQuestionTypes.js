import { useEnums } from '../Context/EnumContext';

/**
 * Custom hook for question type utilities
 * Sử dụng enum từ backend thay vì hard-code
 */
export const useQuestionTypes = () => {
    const { questionTypes, getEnumLabel } = useEnums();

    // Tạo object QUESTION_TYPES động từ enum
    const QUESTION_TYPES = questionTypes.reduce((acc, type) => {
        // Use exact backend enum name (e.g., "MultipleChoice") to match component usage
        acc[type.name] = type.value;
        return acc;
    }, {});

    /**
     * Get question type label (Bilingual: English (Vietnamese))
     */
    const getQuestionTypeLabel = (type) => {
        const rawLabel = getEnumLabel('QuestionType', type);
        
        const nameMap = {
            "MultipleChoice": "Multiple Choice (Trắc nghiệm 1 đáp án)",
            "MultipleAnswers": "Multiple Answers (Trắc nghiệm nhiều đáp án)",
            "TrueFalse": "True / False (Đúng / Sai)",
            "FillBlank": "Fill in Blanks (Điền từ)",
            "Matching": "Matching (Nối từ)",
            "Ordering": "Ordering (Sắp xếp)",
            "ShortAnswer": "Short Answer (Trả lời ngắn)",
            "Essay": "Essay (Tự luận)"
        };

        return nameMap[rawLabel] || rawLabel;
    };

    /**
     * Check if question type requires multiple correct answers
     */
    const requiresMultipleAnswers = (type) => {
        const multipleAnswersType = questionTypes.find(t => t.name === 'MultipleAnswers');
        return type === multipleAnswersType?.value;
    };

    /**
     * Check if question type is matching
     */
    const isMatchingType = (type) => {
        const matchingType = questionTypes.find(t => t.name === 'Matching');
        return type === matchingType?.value;
    };

    /**
     * Check if question type is ordering
     */
    const isOrderingType = (type) => {
        const orderingType = questionTypes.find(t => t.name === 'Ordering');
        return type === orderingType?.value;
    };

    return {
        QUESTION_TYPES,
        questionTypes,
        getQuestionTypeLabel,
        requiresMultipleAnswers,
        isMatchingType,
        isOrderingType,
    };
};
