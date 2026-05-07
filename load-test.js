import http from 'k6/http';
import { sleep, check } from 'k6';

/**
 * Kịch bản Load Test:
 * 1. Tăng tốc: Từ 0 lên 500 Virtual Users (VUs) trong 20 giây.
 * 2. Duy trì: Giữ ở mức 500 VUs trong 30 giây để kiểm tra độ ổn định.
 * 3. Hạ nhiệt: Giảm từ 500 về 0 VUs trong 10 giây.
 */
export const options = {
    stages: [
        { duration: '20s', target: 500 }, 
        { duration: '30s', target: 500 }, 
        { duration: '10s', target: 0 },   
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'], // Tỉ lệ lỗi phải thấp hơn 1%
        http_req_duration: ['p(95)<2000'], // 95% request phải phản hồi dưới 2 giây
    },
};

export default function () {
    const res = http.get('https://learning-eng.hocnghiepvu.com/home');
    
    // Kiểm tra xem trang có trả về mã 200 (Thành công) không
    check(res, {
        'status is 200': (r) => r.status === 200,
        'page contains logo': (r) => r.body.includes('Catalunya English'),
    });

    sleep(1);
}
