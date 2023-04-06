import Taro from '@tarojs/taro';
import { Except } from 'type-fest';

export function popToast(message: string, options: Except<Taro.showToast.Option, 'title'> = {}) {
    Taro.showToast({
        title: message,
        ...options,
        icon: 'none' || options.icon,
    });
}

export { scanCode, chooseImage, locationHandler } from '@/alias-utils/taro-alias-utils';
