/**
 * Chuyển đổi số thành chữ tiếng Việt rút gọn (VD: 500000 -> 500 nghìn đồng)
 * @param {number|string} number 
 * @returns {string}
 */
export const convertToVietnameseWordsCount = (number) => {
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
    
    if (remain > 0) {
        result.push(`${remain}`);
    }
    
    if (result.length > 0) {
        result.push("đồng");
    }

    return result.join(" ").trim();
};

/**
 * Chuyển đổi số thành chữ tiếng Việt đầy đủ (VD: 500000 -> năm trăm nghìn đồng)
 */
export const toVietnameseWords = (number) => {
    if (number === "" || number === null || number === undefined) return "";
    let num = parseInt(typeof number === 'string' ? number.replace(/[^\d]/g, '') : number);
    if (isNaN(num)) return "";
    if (num === 0) return "không đồng";
    if (num < 0) return "số âm không hỗ trợ";

    const unit = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];
    const strings = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    function readTriple(triple, showZeroHundreds) {
        let a = Math.floor(triple / 100);
        let b = Math.floor((triple % 100) / 10);
        let c = triple % 10;
        let res = "";

        if (a > 0) {
            res = strings[a] + " trăm ";
        } else if (showZeroHundreds) {
            res = "không trăm ";
        }

        if (b > 0) {
            if (b === 1) res += "mười ";
            else res += strings[b] + " mươi ";
        } else if (res !== "" && c > 0) {
            res += "linh ";
        }

        if (c > 0) {
            if (c === 1 && b > 1) res += "mốt";
            else if (c === 5 && b > 0) res += "lăm";
            else res += strings[c];
        }

        return res.trim();
    }

    let triples = [];
    let temp = num;
    while (temp > 0) {
        triples.push(temp % 1000);
        temp = Math.floor(temp / 1000);
    }

    let res = "";
    // Tìm nhóm cuối cùng không phải là 0 để biết khi nào dừng showZeroHundreds
    let lastNonZeroIndex = 0;
    for (let i = 0; i < triples.length; i++) {
        if (triples[i] > 0) {
            lastNonZeroIndex = i;
            break;
        }
    }

    for (let i = triples.length - 1; i >= 0; i--) {
        // Chỉ hiện số không trăm nếu nhóm này hoặc các nhóm sau nó có dữ liệu
        // Và nó không phải là nhóm đầu tiên của số (ví dụ: số 500 thì không đọc "không nghìn năm trăm")
        let showZeroHundreds = (i < triples.length - 1) && (i >= lastNonZeroIndex);
        
        let t = readTriple(triples[i], showZeroHundreds);
        
        if (t !== "") {
            res += " " + t + unit[i];
        }
    }

    return res.trim() + " đồng";
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
