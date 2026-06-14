import React, { useEffect } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import { useInterviewStore } from '@/store/interview';
import './app.scss';

function App(props) {
  const initFromStorage = useInterviewStore(state => state.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  useDidShow(() => {});

  useDidHide(() => {});

  return props.children;
}

export default App;
