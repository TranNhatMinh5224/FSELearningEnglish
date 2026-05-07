import http from 'k6/http';
import { sleep } from 'k6';

/**
 * Kịch bản Stress Test (Tìm điểm gãy):
 * Tăng dần từ 0 lên 2000 người dùng trong 5 phút.
 */
export const options = {
    stages: [
        { duration: '1m', target: 500 },  // 1 phút đầu: lên 500
        { duration: '1m', target: 1000 }, // Phút thứ 2: lên 1000
        { duration: '1m', target: 1500 }, // Phút thứ 3: lên 1500
        { duration: '1m', target: 2000 }, // Phút thứ 4: lên 2000
        { duration: '1m', target: 0 },    // Phút cuối: hạ nhiệt
    ],
};

export default function () {
    http.get('https://learning-eng.hocnghiepvu.com/home');
    sleep(1);
}
