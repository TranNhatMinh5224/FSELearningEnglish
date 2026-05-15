import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import enumService from '../Services/enumService';

const EnumContext = createContext();

export const useEnums = () => {
    const context = useContext(EnumContext);
    if (!context) {
        throw new Error('useEnums must be used within EnumProvider');
    }
    return context;
};

export const EnumProvider = ({ children }) => {
    const [enums, setEnums] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEnums = async () => {
            try {
                setLoading(true);
                const response = await enumService.getAllEnums();
                
                if (response.data && response.data.success && response.data.data) {
                    setEnums(response.data.data);
                } else {
                    throw new Error('Failed to load enums');
                }
            } catch (err) {
                console.error('Error loading enums:', err);
                setError(err.message || 'Failed to load enums');
            } finally {
                setLoading(false);
            }
        };

        fetchEnums();
    }, []);

    // Tự động tạo mappings từ Name sang Value để dùng trong logic code
    // Ví dụ: mappings.QuestionType.MultipleChoice sẽ trả về giá trị từ backend
    const mappings = useMemo(() => {
        if (!enums) return {};
        const map = {};
        Object.keys(enums).forEach(enumName => {
            map[enumName] = {};
            enums[enumName].forEach(item => {
                // Hỗ trợ cả PascalCase và camelCase từ API
                const name = item.Name || item.name;
                const value = item.Value !== undefined ? item.Value : item.value;
                if (name) map[enumName][name] = value;
            });
        });
        return map;
    }, [enums]);

    const getEnumLabel = (enumName, value) => {
        if (!enums || !enums[enumName]) return 'Unknown';
        const enumItem = enums[enumName].find(item => {
            const itemVal = item.Value !== undefined ? item.Value : item.value;
            return itemVal === value;
        });
        return enumItem ? (enumItem.DisplayName || enumItem.displayName || enumItem.Name || enumItem.name) : 'Unknown';
    };

    const getEnumOptions = (enumName) => {
        if (!enums || !enums[enumName]) return [];
        return enums[enumName].map(item => ({
            value: item.Value !== undefined ? item.Value : item.value,
            label: item.DisplayName || item.displayName || item.Name || item.name
        }));
    };

    const value = {
        enums,
        mappings, // Đối tượng mapping động
        loading,
        error,
        getEnumLabel,
        getEnumOptions,
        
        // Shortcuts cho các enum thường dùng (Raw data)
        questionTypes: enums?.QuestionType || [],
        quizTypes: enums?.QuizType || [],
        quizStatuses: enums?.QuizStatus || [],
        courseStatuses: enums?.CourseStatus || [],
        courseTypes: enums?.CourseType || [],
        difficultyLevels: enums?.DifficultyLevel || [],
        moduleTypes: enums?.ModuleType || [],
        submissionStatuses: enums?.SubmissionStatus || [],
        paymentStatuses: enums?.PaymentStatus || [],
        productTypes: enums?.ProductType || [],
        assetTypes: enums?.AssetType || [],
        lectureTypes: enums?.LectureType || [],
    };

    return (
        <EnumContext.Provider value={value}>
            {children}
        </EnumContext.Provider>
    );
};
