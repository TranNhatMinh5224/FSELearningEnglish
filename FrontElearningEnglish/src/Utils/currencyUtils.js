/**
 * Chuyển đổi số thành chữ tiếng Việt rút gọn (VD: 500000 -> 500 nghìn đồng)
 * @param {number|string} number 
 * @returns {string}
 */
export const convertToVietnameseWords = (number) => {
    if (number === "" || number === null || number === undefined) return "";
    
    let num = parseInt(typeof number === 'string' ? number.replace(/[^\d]/g, '') : number);
    
    if (isNaN(num) || num === 0) return "";
    if (num < 0) return "Số tiền không hợp lệ";

    const billion = Math.floor(num / 1000000000);
    num %= 1000000000;
    const million = Math.floor(num / 1000000);
    num %= 1000000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const remain = num;

    let result = [];
    if (billion > 0) result.push(`${billion} tỷ`);
    if (million > 0) result.push(`${million} triệu`);
    if (thousand > 0) result.push(`${thousand} nghìn`);
    
    // Xử lý số lẻ nếu cần (thường tiền tệ hệ thống không dùng số lẻ nhỏ hơn nghìn nhiều, nhưng cứ support)
    if (remain > 0) {
        if (result.length === 0) {
            result.push(`${remain}`);
        } else {
            result.push(`${remain}`);
        }
    }
    
    if (result.length > 0) {
        result.push("đồng");
    }

    return result.join(" ").trim();
};

/**
 * Định dạng tiền tệ VND có dấu phân cách
 * @param {number} amount 
 * @returns {string}
 */
export const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(amount);
};
