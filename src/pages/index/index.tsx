import { View, WebView, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import React, { useEffect } from 'react';
import { createBEM } from '../../utils/class-utils';
// import { appendSearchParams } from '@/utils/history-utils';
import { appendSearchParams } from '../../utils/history-utils';

// import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';

import './index.less';

const bem = createBEM('web-view-page');



export default function WebViewPage(): ReturnType<React.FC> {
  const { url = '' } = useRouter().params;

  const handleWebView = () => {

    const params = [
      { position: [30, 114], content: 'Marker 1' },
      { position: [41, 115], content: 'Marker 2' },
    ]

    Taro.redirectTo({
      url: appendSearchParams('/pages/web-view/index', {
        url: `http://localhost:3000/`, queryParams: JSON.stringify(params)
      }),
    });
  }

  useEffect(() => {
    // handleWebView()
  }, [])

  return (
    <View className={bem()}>
      yarn add leaflet
      yarn add react-leaflet
      yarn add -D @types/leaflet


      <View>
        <Text onClick={handleWebView} >1234</Text>
      </View>

    </View>
  );
}
