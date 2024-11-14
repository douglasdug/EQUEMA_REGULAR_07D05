import CryptoJS from "crypto-js";

const secretKey = "your-secret-key";

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, secretKey).toString();
};

export const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
};
