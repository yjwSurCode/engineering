import Taro from '@tarojs/taro';

export async function scanCode(options: Taro.scanCode.Option = {}): Promise<string | undefined> {
    const res = await Taro.scanCode(options).catch(({ errMsg }) => {
        if (errMsg && errMsg.search('cancel')) {
            return;
        }

        Taro.showToast({ title: errMsg, ...options, icon: 'none' });
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
    }).catch(({ errMsg }) => {
        if (errMsg && errMsg.search('cancel')) {
            return;
        }

        Taro.showToast({ title: errMsg, ...options, icon: 'none' });
    });

    if (res) {
        return res.tempFilePaths;
    }
}

export function locationHandler({ errMsg }, { modal = true, checkSystem = true, checkSignal = false }) {
    if (errMsg.search(/fail[: ]auth/) > -1) {
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
        return { status: 0, errMsg };
    }

    if (errMsg.search(/fail[: ]system permission denied/) > -1 && checkSystem) {
        if (modal) {
            Taro.showModal({
                title: '检测到微信未开启定位服务，请通过“设置-微信-位置”，开启定位功能',
                showCancel: false,
            });
        }

        return { status: 0, errMsg };
    }

    if (errMsg.search('ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF') > -1) {
        // 情况一: 手机基站、WIFI异常
        if (checkSignal) {
            Taro.showModal({
                title: '检查到系统未开启定位开关(GPS定位)或WiFi, 请在系统设置中开启',
                showCancel: false,
            });

            return { status: 0, errMsg };
        }

        // 情况二： 未开启系统定位
        if (checkSystem) {
            try {
                // 基础库2.20.1以上
                const systemSetting = Taro.getSystemSetting();

                if (systemSetting.locationEnabled === false) {
                    Taro.showModal({
                        title: '检查到系统未开启定位开关(GPS定位)或WiFi, 请在系统设置中开启',
                        showCancel: false,
                    });

                    return { status: 0, errMsg };
                }
            } catch (err) {}
        }
    }

    return { status: 2, errMsg: errMsg };
}
