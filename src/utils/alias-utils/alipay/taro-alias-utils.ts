import Taro from '@tarojs/taro';

export async function scanCode(options: Taro.scanCode.Option = {}): Promise<string | undefined> {
    const res = await Taro.scanCode(options).catch((err) => {
        // 11 扫码失败  10 扫码取消
        if (err.error === 11) {
            Taro.showToast({ title: err.message || '扫码失败，请重试' });
            return;
        }

        // 2001 当次拒绝授权   2002 总是拒绝授权
        if (err.error === 2002) {
            Taro.showModal({
                title: '扫码授权',
                content: '扫码功能需开启相机授权',
                confirmText: '去授权',
                success: ({ confirm }) => {
                    if (confirm) {
                        Taro.openSetting();
                    }
                },
            });
        }

        return;
    });

    if (res) {
        return res.result;
    }
}

export async function chooseImage(options: Taro.chooseImage.Option = {}): Promise<string[] | undefined> {
    const res = await Taro.chooseImage({
        sourceType: ['album', 'camera'],
        count: 1,
        ...options,
    }).catch((err) => {
        // 取消操作、取消授权

        // if (err.error === 11) {
        //     Taro.showToast({ title: err.errorMessage || '用户取消操作' });
        //     return;
        // }

        // 2001 当次拒绝授权   2002 总是拒绝授权
        if (err.error === 2002) {
            Taro.showModal({
                title: '授权相册',
                content: '需开启相册授权',
                confirmText: '去授权',
                success: ({ confirm }) => {
                    if (confirm) {
                        Taro.openSetting();
                    }
                },
            });
        }

        return;
    });

    if (res) {
        return (res as any).apFilePaths || res.tempFilePaths;
    }
}

export function locationHandler(
    { error, errorMessage = '' },
    { modal = true, checkSystem = true, checkSignal = false },
) {
    if ([2001, 2002, 2003].includes(error)) {
        if (modal) {
            Taro.showModal({
                title: '检测到您没打开定位权限，请设置打开',
                success: ({ confirm }) => {
                    if (confirm) {
                        Taro.openSetting();
                    }
                },
            });
        }
        return { status: 0, errMsg: 'fail auth' };
    }

    if (error === 11 && checkSystem) {
        if (modal) {
            Taro.showModal({
                title: '用户设备未开启定位功能，或未授予支付宝定位权限, 请设置打开',
                showCancel: false,
            });
        }

        return { status: 0, errMsg: 'fail system permission denied' };
    }

    // 手机基站、WIFI异常
    if (error === 18 && checkSignal) {
        if (modal) {
            Taro.showModal({
                title: '未获取到基站或WIFI信号',
                showCancel: false,
            });
        }

        return { status: 0, errMsg: 'ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' };
    }

    return { status: 2, errMsg: errorMessage };
}
