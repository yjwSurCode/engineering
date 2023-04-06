import { View, WebView, Text } from '@tarojs/components';
import { useRouter } from '@tarojs/taro';
import React from 'react';
import { createBEM } from '../../utils/class-utils';
import './index.less';

const bem = createBEM('web-view-page');

export default function WebViewPage(): ReturnType<React.FC> {
    const { url = '', queryParams = '' } = useRouter().params;

    console.log(queryParams, 'params', JSON.parse(queryParams), decodeURIComponent(url + '?' + queryParams))


    return (
        <View className={bem()}>
            <Text>11111</Text>
            {url !== '' ? <WebView src={decodeURIComponent(url + '?' + queryParams)}></WebView> : <View>没找到对应的页面</View>}
        </View>
    );
}
