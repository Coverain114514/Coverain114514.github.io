// JSONBin 配置
const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay'; // 替换成你的 API Key
const BIN_ID = '67482f7fad19ca34f8d1df3a'; // 替换成你的 Bin ID
const BASE_URL = 'https://api.jsonbin.io/v3/b';

let messages = [];

// 从 JSONBin 加载留言数据
async function loadMessages() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        messages = data.record.messages || [];
        displayMessages();
    } catch (error) {
        console.error('加载留言失败:', error);
        document.getElementById('messageList').innerHTML = 
            `<p class="error-message">加载失败，请刷新页面重试</p>`;
    }
}

// 显示留言列表
function displayMessages() {
    const messageList = document.getElementById('messageList');
    messageList.innerHTML = '';
    
    if (messages.length === 0) {
        messageList.innerHTML = '<p class="no-messages">还没有留言，来发表第一条留言吧！</p>';
        return;
    }
    
    messages.forEach(message => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message-item';
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="message-author">
                    ${message.isAnonymous ? '匿名用户' : message.author}
                </span>
                <span class="message-date">
                    ${new Date(message.date).toLocaleString()}
                </span>
            </div>
            <div class="message-content">${message.content}</div>
        `;
        
        messageList.appendChild(messageDiv);
    });
}

// 更新 JSONBin 数据
async function updateMessagesInJsonBin() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ messages })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update messages');
        }
    } catch (error) {
        throw error;
    }
}

// 处理留言提交
async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const isAnonymous = document.getElementById('isAnonymous').checked;
    const authorName = document.getElementById('authorName').value;
    const content = document.getElementById('messageContent').value;
    
    if (!isAnonymous && !authorName.trim()) {
        alert('请输入你的昵称');
        return;
    }
    
    if (!content.trim()) {
        alert('请输入留言内容');
        return;
    }
    
    const newMessage = {
        author: isAnonymous ? '匿名用户' : authorName.trim(),
        content: content.trim(),
        date: new Date().toISOString(),
        isAnonymous
    };
    
    try {
        messages.push(newMessage);
        await updateMessagesInJsonBin();
        
        // 重新显示留言列表
        displayMessages();
        
        // 清空表单
        document.getElementById('messageForm').reset();
        
        alert('留言发表成功！');
    } catch (error) {
        console.error('留言提交失败:', error);
        alert('留言提交失败，请重试');
    }
}

// 处理匿名选项变化
function handleAnonymousChange() {
    const isAnonymous = document.getElementById('isAnonymous').checked;
    const nameGroup = document.getElementById('nameGroup');
    const authorNameInput = document.getElementById('authorName');
    
    if (isAnonymous) {
        nameGroup.style.display = 'none';
        authorNameInput.removeAttribute('required');
    } else {
        nameGroup.style.display = 'block';
        authorNameInput.setAttribute('required', 'required');
    }
}

// 初始化事件监听器
function initializeEventListeners() {
    // 表单提交事件
    document.getElementById('messageForm').addEventListener('submit', handleMessageSubmit);
    
    // 匿名选项变化事件
    document.getElementById('isAnonymous').addEventListener('change', handleAnonymousChange);
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadMessages();
    initializeEventListeners();
});
