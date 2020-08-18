
const slugifyModule = require("slugify");

export function slugify(text) {
  return slugifyModule(text).toLowerCase();
}

export function ok(response) {
    if (!response) return false;
    if (!response.result) return false;
    if (!response.result.ok) return false;
    return true;
}

export function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


export function round(num, digits=2) {
    return Math.floor(num * Math.pow(10, digits)) / Math.pow(10, digits);
}

export function diff(num1, num2) {
  if (num1 > num2) {
    return num1 - num2
  } else {
    return num2 - num1
  }
}

const crypto = require("crypto");
export function hash(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export function nl2br(str, is_xhtml) {
    if (typeof str === 'undefined' || str === null) {
        return '';
    }
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};


