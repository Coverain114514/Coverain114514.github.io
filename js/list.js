﻿const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '6747cfdeacd3cb34a8b03128';
const BASE_URL = 'https://api.jsonbin.io/v3/b';
let currentBlog = null;
let blogs = [];

// 加载博客列表
async function loadBlogs() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        blogs = data.record.blogs || [];
        
        displayBlogs();
    } catch (error) {
        console.error('加载博客失败:', error);
        document.getElementById('blogList').innerHTML = '<p>加载失败，请刷新页面重试</p>';
    }
}

// 显示博客列表
function displayBlogs() {
    const blogList = document.getElementById('blogList');
    blogList.innerHTML = '';
    
    blogs.forEach((blog, index) => {
        const blogItem = document.createElement('div');
        blogItem.className = 'blog-item';
        blogItem.innerHTML = `
            <h3>${blog.title}</h3>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span> | 
                <span>❤️ ${blog.likes || 0}</span> | 
                <span>💬 ${blog.comments?.length || 0}</span>
            </div>
            <p>${blog.content.substring(0, 100)}...</p>
            <small>发布时间：${new Date(blog.date).toLocaleString()}</small>
        `;
        blogItem.onclick = () => showBlogDetail(index);
        blogList.appendChild(blogItem);
    });
}

// 显示博客详情
function showBlogDetail(index) {
    currentBlog = blogs[index];
    const modal = document.getElementById('blogModal');
    
    document.getElementById('modalTitle').textContent = currentBlog.title;
    document.getElementById('modalAuthor').textContent = `作者：${currentBlog.author}`;
    document.getElementById('modalContent').innerHTML = currentBlog.content;
    document.getElementById('modalDate').textContent = 
        `发布时间：${new Date(currentBlog.date).toLocaleString()}`;
    
    updateLikeButton();
    loadComments();
    
    modal.style.display = 'block';
}

// 更新点赞按钮状态
function updateLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    const userId = localStorage.getItem('userId') || generateUserId();
    
    likeCount.textContent = currentBlog.likes || 0;
    if (currentBlog.likedBy?.includes(userId)) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

// 加载评论列表
function loadComments() {
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';
    
    if (!currentBlog.comments) {
        currentBlog.comments = [];
    }
    
    currentBlog.comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.innerHTML = `
            <div class="comment-author">${comment.author}</div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-date">${new Date(comment.date).toLocaleString()}</div>
        `;
        commentList.appendChild(commentDiv);
    });
}

async function handleLike(e) {
    e.stopPropagation();
    const userId = localStorage.getItem('userId') || generateUserId();
    
    // 找到当前博客在数组中的索引
    const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
    
    // 初始化必要的属性
    if (!blogs[blogIndex].likedBy) blogs[blogIndex].likedBy = [];
    if (!blogs[blogIndex].likes) blogs[blogIndex].likes = 0;
    
    const isLiked = blogs[blogIndex].likedBy.includes(userId);
    
    if (!isLiked) {
        // 添加点赞
        blogs[blogIndex].likes++;
        blogs[blogIndex].likedBy.push(userId);
    } else {
        // 取消点赞
        blogs[blogIndex].likes--;
        blogs[blogIndex].likedBy = blogs[blogIndex].likedBy.filter(id => id !== userId);
    }
    
    try {
        // 更新JSONBin
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        // 更新当前博客对象
        currentBlog = blogs[blogIndex];
        // 更新UI
        updateLikeButton();
        displayBlogs(); // 刷新列表显示
        
    } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞操作失败，请重试');
    }
}

// 修改后的评论处理函数
async function handleComment(e) {
    e.preventDefault();
    
    const commentAuthor = document.getElementById('commentAuthor').value;
    const commentContent = document.getElementById('commentContent').value;
    
    if (!commentAuthor.trim() || !commentContent.trim()) {
        alert('请填写昵称和评论内容');
        return;
    }
    
    // 找到当前博客在数组中的索引
    const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
    
    // 初始化评论数组
    if (!blogs[blogIndex].comments) {
        blogs[blogIndex].comments = [];
    }
    
    const newComment = {
        author: commentAuthor,
        content: commentContent,
        date: new Date().toISOString()
    };
    
    blogs[blogIndex].comments.push(newComment);
    
    try {
        // 更新JSONBin
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        // 更新当前博客对象
        currentBlog = blogs[blogIndex];
        // 更新UI
        loadComments();
        // 清空表单
        document.getElementById('commentForm').reset();
        // 刷新列表显示
        displayBlogs();
        
    } catch (error) {
        console.error('评论提交失败:', error);
        alert('评论提交失败，请重试');
    }
}

// 修改事件监听器的绑定方式
function initializeEventListeners() {
    // 点赞按钮事件
    document.getElementById('likeBtn').onclick = handleLike;
    
    // 评论表单提交事件
    document.getElementById('commentForm').onsubmit = handleComment;
    
    // 关闭模态框
    document.querySelector('.close').onclick = function() {
        document.getElementById('blogModal').style.display = 'none';
    };
    
    // 点击模态框外部关闭
    window.onclick = function(event) {
        const modal = document.getElementById('blogModal');
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}


// 生成用户ID
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}

// 事件监听器
document.getElementById('likeBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    handleLike();
});

document.getElementById('commentForm').addEventListener('submit', handleComment);

// 关闭模态框
document.querySelector('.close').onclick = function() {
    document.getElementById('blogModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('blogModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// 页面加载时初始化
window.onload = loadBlogs;
