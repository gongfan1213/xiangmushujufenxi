// 导入项目全局样式
import './App.css';
// 导入 React 核心库
import React from 'react';
// 导入 ChatUI 组件库的核心样式 (less)
import '@chatui/core/es/styles/index.less';
// 导入 ChatUI 的核心组件 Chat, Bubble 和消息管理 hook useMessages
import Chat, { Bubble, useMessages } from '@chatui/core';
// 导入 ChatUI 组件库的预编译 CSS 样式
import '@chatui/core/dist/index.css';
// 导入 OpenAI 官方库
import OpenAI from 'openai';
// 导入自定义的 ChatUI 主题样式
import './chatui-theme.css';

// 初始化 OpenAI 客户端实例
const openai = new OpenAI({
  apiKey: 'EMPTY', // 设置 API Key，'EMPTY' 通常用于本地或代理服务器
  dangerouslyAllowBrowser: true, // 允许在浏览器环境直接调用 OpenAI API（注意：生产环境不推荐，可能暴露密钥）
  baseURL: "http://server-llm-dev:8000/v1" // 设置 OpenAI API 的基础 URL，指向本地或代理服务器
});

// 定义一个全局变量用于存储对话历史记录
var message_history = [];

// 定义主要的 React 应用组件 App
function App() {
  // 使用 ChatUI 的 useMessages hook 管理聊天消息状态
  // messages: 存储当前聊天窗口显示的消息数组
  // appendMsg: 函数，用于向消息数组末尾添加新消息
  // setTyping: 函数，用于设置聊天窗口是否显示 "对方正在输入..." 状态
  // updateMsg: 函数，用于更新已存在消息的内容
  const { messages, appendMsg, setTyping, updateMsg } = useMessages([]);

  // 定义异步函数 chat_stream，用于处理与 OpenAI 的流式对话
  // prompt: 用户输入的文本
  // _msgId: 需要更新的 AI 响应消息的 ID
  async function chat_stream(prompt, _msgId) {
    // 将用户的消息添加到对话历史记录中
    message_history.push({ role: 'user', content: prompt });

    // 调用 OpenAI 的流式聊天接口
    const stream = openai.beta.chat.completions.stream({
      model: 'ChatGLM3-6B', // 指定使用的 AI 模型
      messages: message_history, // 传入包含历史记录的消息数组
      stream: true, // 启用流式响应
    });

    // 初始化一个空字符串，用于累积流式响应的文本片段
    var snapshot = "";
    // 异步迭代处理返回的流数据
    for await (const chunk of stream) {
      // 将每个数据块中的文本内容追加到 snapshot 字符串
      // 使用可选链 (?.) 和空值合并 (|| '') 来处理可能的 null 或 undefined 值
      snapshot = snapshot + (chunk.choices[0]?.delta?.content || '');
      // 使用 updateMsg 更新界面上对应 _msgId 的消息内容
      updateMsg(_msgId, {
        type: "text", // 消息类型为文本
        content: { text: snapshot.trim() } // 更新文本内容为当前累积的 snapshot (去除首尾空格)
      });
    }
    // 流处理完成后，将完整的 AI 响应添加到对话历史记录中
    message_history.push({ "role": "assistant", "content": snapshot });
  }

  // 定义处理用户发送消息的函数
  // type: 消息类型 (通常是 'text')
  // val: 消息内容 (用户输入的文本)
  function handleSend(type, val) {
    // 检查消息类型是否为 'text' 且内容去除首尾空格后不为空
    if (type === 'text' && val.trim()) {
      // 使用 appendMsg 将用户发送的消息添加到消息列表，显示在右侧
      appendMsg({
        type: 'text',
        content: { text: val },
        position: 'right', // 'right' 表示用户发送的消息
      });

      // 生成一个基于当前时间戳的唯一消息 ID，用于标识 AI 的响应消息
      const msgID = new Date().getTime();
      // 设置输入状态为 true，显示 "对方正在输入..."
      setTyping(true);
      // 使用 appendMsg 添加一个空的占位消息，用于接收 AI 的流式响应
      appendMsg({
        _id: msgID, // 设置消息的唯一 ID
        type: 'text',
        content: { text: '' }, // 初始内容为空
        // 默认 position 为 'left'，表示对方（AI）的消息
      });
      // 调用 chat_stream 函数，开始获取 AI 的流式响应
      chat_stream(val, msgID);
    }
  }

  // 定义渲染消息内容的函数
  // msg: 单个消息对象
  function renderMessageContent(msg) {
    // 从消息对象中解构出 content 属性
    const { content } = msg;
    // 使用 ChatUI 的 Bubble 组件渲染消息文本
    return <Bubble content={content.text} />;
  }

  // 返回 ChatUI 的 Chat 组件，构建聊天界面
  return (
    <Chat
      navbar={{ title: 'chat-app' }} // 设置导航栏标题
      messages={messages} // 传递消息数组给 Chat 组件
      renderMessageContent={renderMessageContent} // 指定消息内容的渲染函数
      onSend={handleSend} // 指定发送消息时的处理函数
    />
  );
}

// 导出 App 组件作为默认导出
export default App;

// 工作流程讲解:

// 1. 初始化:
   
//    - 导入所需的库和样式文件 (React, ChatUI, OpenAI, CSS)。
//    - 配置 OpenAI 客户端，指定 API Key (此处为 'EMPTY')、允许浏览器环境使用 ( dangerouslyAllowBrowser: true ) 以及 API 的基础 URL ( http://server-llm-dev:8000/v1 )。
//    - 初始化一个空的 message_history 数组，用于存储对话历史记录，以便将其发送给 OpenAI 模型。
//    - 在 `App` 组件中，使用 ChatUI 的 useMessages hook 来管理聊天消息状态 ( messages )，并获取添加消息 ( appendMsg )、设置输入状态 ( setTyping ) 和更新消息 ( updateMsg ) 的函数。
// 2. 发送消息 ( handleSend ):
   
//    - 当用户在聊天界面输入文本并发送时， `handleSend` 函数被调用。
//    - 检查消息类型是否为 'text' 且内容不为空。
//    - 使用 appendMsg 将用户发送的消息添加到 messages 状态中，并设置 position 为 'right'（表示用户消息）。
//    - 生成一个唯一的消息 ID ( msgID )，通常使用时间戳。
//    - 调用 setTyping(true) 在界面上显示 "对方正在输入..." 的状态。
//    - 使用 appendMsg 添加一个空的占位消息，这个消息稍后会被 AI 的响应流式更新。这个占位消息使用之前生成的 msgID 。
//    - 调用 `chat_stream` 函数，将用户的输入 ( val ) 和占位消息的 ID ( msgID ) 传递过去，以获取 AI 的响应。
// 3. 获取 AI 响应 ( chat_stream ):
   
//    - 将用户的当前消息 { role: 'user', content: prompt } 添加到 message_history 数组中。
//    - 调用 OpenAI 的 stream API ( openai.beta.chat.completions.stream )，传入模型名称 ('ChatGLM3-6B')、完整的对话历史 ( message_history ) 和 stream: true 参数，请求流式响应。
//    - 初始化一个空字符串 snapshot 用于累积 AI 返回的文本片段。
//    - 使用 for await...of 循环异步迭代处理返回的流数据 ( stream )。
//    - 在每次迭代中，获取流中的文本片段 ( chunk.choices[0]?.delta?.content ) 并追加到 snapshot 。
//    - 使用 updateMsg 函数，根据 _msgId 更新之前创建的占位消息，将其内容 ( content.text ) 设置为当前累积的 snapshot 。这使得 AI 的响应能够实时、逐字地显示在界面上。
//    - 流处理结束后，将完整的 AI 响应 { "role": "assistant", "content": snapshot } 添加到 message_history 中，以便后续对话能够包含完整的上下文。
// 4. 渲染消息 ( renderMessageContent ):
   
//    - `renderMessageContent` 函数负责定义如何渲染每条消息。
//    - 它接收消息对象 msg 作为参数。
//    - 从 msg 中提取 content 对象。
//    - 使用 ChatUI 的 <Bubble> 组件来显示消息的文本内容 ( content.text )。
// 5. 渲染 Chat 组件:
   
//    - `App` 组件的 return 语句渲染 ChatUI 的 <Chat> 组件。
//    - navbar 属性设置导航栏标题。
//    - messages 属性传递当前要显示的所有消息数组。
//    - renderMessageContent 属性指定使用上面定义的 `renderMessageContent` 函数来渲染每条消息。
//    - onSend 属性指定使用上面定义的 `handleSend` 函数来处理用户发送消息的事件。