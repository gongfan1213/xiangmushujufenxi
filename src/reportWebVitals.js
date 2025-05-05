const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;
// - - getCLS (Cumulative Layout Shift): 测量 累积布局偏移 ，反映页面的视觉稳定性。
// - getFID (First Input Delay): 测量 首次输入延迟 ，反映页面的交互响应速度。
// - getFCP (First Contentful Paint): 测量 首次内容绘制 时间，反映页面开始渲染内容的速度。
// - getLCP (Largest Contentful Paint): 测量 最大内容绘制 时间，反映页面主要内容加载完成的速度。
// - getTTFB (Time to First Byte): 测量 首字节到达时间 ，反映服务器响应速度。
// - 执行回调: 每当上述任一指标被成功测量出来时， web-vitals 库会调用你传入的 onPerfEntry 回调函数，并将测量结果作为参数传递给它。