import { Dictionary } from '@/core/interfaces';
import encUtf8 from 'crypto-js/enc-utf8';
import encHex from 'crypto-js/enc-hex';
import encBase64 from 'crypto-js/enc-base64';
import AES from 'crypto-js/aes';

//手机api默认aes key, iv
const APIKEY = 'HqKJ5423b42nKv0z6Jg4BobG3fHJs3Hp';
const APIIV = 'dGa2E5s5A2AafRG3';
/**
 * aes加密 仅支持 CBC 模式
 * @param {param:加密入参,key:服务器key,iv:服务器偏移量}
 * @return { aes:aes源码, hex:16进制, base64:base64}
 * @author
 */
export function aesCBC(param: any, key = APIKEY, iv = APIIV) {
    //aes base64 utf8 转码
    const _key = encUtf8.parse(key),
        _iv = encUtf8.parse(iv),
        _param = encUtf8.parse(param),
        //aes源码
        encrypted = AES.encrypt(param, key, {
            iv: iv as any,
        }).toString();

    //aes base64解码
    const aes = AES.encrypt(_param, _key, { iv: _iv });
    //16进制源码
    const hexStr = aes.ciphertext.toString().toUpperCase();
    //16进制转码
    const hexParse = encHex.parse(hexStr);
    //base64 16进制解码
    const base64Str = encBase64.stringify(hexParse);

    return {
        aes: encrypted,
        hex: hexStr,
        base64: base64Str,
    };
}

/**
 * aesDecrypt解密 仅支持 CBC 模式
 * @param {param:aes入参,key:服务器key,iv:服务器偏移量}
 * @return string
 * @author
 */
export function aesDecrypt(param: any, key = APIKEY, iv = APIIV) {
    // aes 解密
    const decrypt = AES.decrypt(param, key, { iv: iv as any });
    const decryptedStr = decrypt.toString(encUtf8);
    // console.log("aes->"+decryptedStr)
    return decryptedStr;
}

/**
 * aesDecryptHex解密 16进制解密
 * @param {param:hex入参,key:服务器key,iv:服务器偏移量}
 * @return string
 * @author
 */
export function aesDecryptHex(param: any, key = APIKEY, iv = APIIV) {
    const _key = encUtf8.parse(key);
    const _iv = encUtf8.parse(iv);

    const encryptedHexStr = encHex.parse(param);
    const srcs = encBase64.stringify(encryptedHexStr);
    const decrypt = AES.decrypt(srcs, _key, { iv: _iv });
    const decryptedStr = decrypt.toString(encUtf8);
    // console.log("hex->"+decryptedStr.toString())
    return decryptedStr.toString();
}

/**
 * aesDecryptencBase64解密 base64解密
 * @param {param:base64入参,key:服务器key,iv:服务器偏移量}
 * @return string
 * @author
 */
export function aesDecryptencBase64(param: any, key = APIKEY, iv = APIIV) {
    const _key = encUtf8.parse(key);
    const _iv = encUtf8.parse(iv);

    const decrypt = AES.decrypt(param, _key, { iv: _iv });
    const decryptedStr = decrypt.toString(encUtf8);
    // console.log("base64->"+decryptedStr.toString())
    return decryptedStr.toString();
}

/**
 * aesObjectFilter
 * @param {param: obj对象, type: 处理方法, key?: 目标}
 * @return string
 * @author
 */
export function aesObjectFilter(obj: Dictionary, type: 'encrypt' | 'decrypt', key?: string | string[]) {
    if (isEmptyObject(obj)) {
        return obj;
    }

    const newObj = { ...obj };

    const tKey = key ? (Array.isArray(key) ? key : [key]) : undefined;

    for (const k in obj) {
        if (!tKey || tKey.includes(k)) {
            if (type === 'encrypt') {
                newObj[k] = aesCBC(String(obj[k])).base64;
            } else if (type === 'decrypt') {
                newObj[k] = aesDecryptencBase64(obj[k]);
            }
        }
    }

    return newObj;
}

// 是否空对象
export function isEmptyObject(e: any) {
    let t: any;
    for (t in e) return !1;
    return !0;
}
