export default defineAppConfig({
  pages: [
    'pages/candidates/index',
    'pages/interview/index',
    'pages/scoring/index',
    'pages/records/index',
    'pages/analysis/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FFFFFF',
    navigationBarTitleText: 'AI面试官',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F0F2F5'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#1E5EFF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/candidates/index',
        text: '候选人'
      },
      {
        pagePath: 'pages/interview/index',
        text: '面试'
      },
      {
        pagePath: 'pages/scoring/index',
        text: '评分'
      },
      {
        pagePath: 'pages/records/index',
        text: '记录'
      },
      {
        pagePath: 'pages/analysis/index',
        text: '分析'
      }
    ]
  }
})
