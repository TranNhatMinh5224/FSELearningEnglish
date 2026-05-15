import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../Context/AuthContext';
import ChatBotWidget from './ChatBotWidget';

const ConditionalChatBot = () => {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // 1. Chỉ hiển thị khi đã đăng nhập
    if (!isAuthenticated) return null;

    // 2. Kiểm tra đường dẫn (CỰC KỲ QUAN TRỌNG)
    // Tắt chatbot khi ở giao diện quản trị (Admin) hoặc giao diện giáo viên (Teacher)
    const isExcludedPath = location.pathname.startsWith('/admin') || 
                           location.pathname.startsWith('/teacher');

    // Nếu đang ở các trang quản lý thì ẩn đi
    if (isExcludedPath) return null;

    // 3. Hiển thị ở tất cả các giao diện người dùng khác (Home, Course, Profile, v.v.)
    return <ChatBotWidget />;
};

export default ConditionalChatBot;
