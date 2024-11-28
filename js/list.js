const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '67481f67acd3cb34a8b0577b';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

let currentBlog = null;
let blogs = [];

// 从JSONBin加载博客数据
async function loadBlogs() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch blogs');
        }
        
        const data = await response.json();
        blogs = data.record.blogs || [];
        displayBlogs();
    } catch (error) {
        console.error('加载博客失败:', error);
        document.getElementById('blogList').innerHTML = '<p>加载失败，请刷新页面重试</p>';
    }
}
// 添加显示博客详情的函数
function showBlogDetail(index) {
    currentBlog = blogs[index];
    const modal = document.getElementById('blogModal');
    
    // 更新模态框内容
    document.getElementById('modalTitle').textContent = currentBlog.title;
    document.getElementById('modalAuthor').textContent = `作者：${currentBlog.author}`;
    document.getElementById('modalContent').innerHTML = currentBlog.content;
    document.getElementById('modalDate').textContent = 
        `发布时间：${new Date(currentBlog.date).toLocaleString()}`;
    
    // 更新点赞状态
    updateLikeStatus(index);
    
    // 加载评论
    loadComments();
    
    // 显示模态框
    modal.style.display = 'block';
}

// 添加更新点赞状态的函数
function updateLikeStatus(index) {
    const likeBtn = document.getElementById('modalLikeBtn');
    const likeCount = likeBtn.querySelector('.like-count');
    const userId = localStorage.getItem('userId') || generateUserId();
    
    // 确保likes和likedBy存在
    if (!blogs[index].likes) blogs[index].likes = 0;
    if (!blogs[index].likedBy) blogs[index].likedBy = [];
    
    // 更新点赞数量
    likeCount.textContent = blogs[index].likes;
    
    // 更新点赞状态
    if (blogs[index].likedBy.includes(userId)) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

// 确保HTML中有正确的模态框结构
// 在list.html中添加或更新以下内容：
// 显示博客列表
function displayBlogs() {
    const blogList = document.getElementById('blogList');
    blogList.innerHTML = '';
    
    blogs.forEach((blog, index) => {
        const blogItem = document.createElement('div');
        blogItem.className = 'blog-item';
        
        // 创建博客内容
        const contentDiv = document.createElement('div');
        contentDiv.className = 'blog-content';
        contentDiv.innerHTML = `
            <h3 class="blog-title">${blog.title}</h3>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span>
            </div>
            <p class="blog-preview">${blog.content.substring(0, 100)}...</p>
            <small>发布时间：${new Date(blog.date).toLocaleString()}</small>
        `;
        
        // 创建操作按钮容器
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'blog-actions';
        
        // 创建点赞按钮
        const likeBtn = document.createElement('button');
        likeBtn.className = 'btn-like';
        likeBtn.innerHTML = `
            <span class="like-icon">❤️</span>
            <span class="like-count">${blog.likes || 0}</span>
        `;
        
        // 创建评论按钮
        const commentBtn = document.createElement('button');
        commentBtn.className = 'btn-comment';
        commentBtn.innerHTML = `
            <span class="comment-icon">💬</span>
            <span class="comment-count">${blog.comments?.length || 0}</span>
        `;
        
        // 添加点击事件
        contentDiv.onclick = () => showBlogDetail(index);
        
        likeBtn.onclick = async (e) => {
            e.stopPropagation();
            await handleLike(index);
        };
        
        commentBtn.onclick = (e) => {
            e.stopPropagation();
            openCommentModal(index);
            return false;
        };
        
        // 组装DOM
        actionsDiv.appendChild(likeBtn);
        actionsDiv.appendChild(commentBtn);
        blogItem.appendChild(contentDiv);
        blogItem.appendChild(actionsDiv);
        blogList.appendChild(blogItem);
    });
}

// 处理点赞
async function handleLike(index) {
    const userId = localStorage.getItem('userId') || generateUserId();
    
    if (!blogs[index].likedBy) blogs[index].likedBy = [];
    if (!blogs[index].likes) blogs[index].likes = 0;
    
    const isLiked = blogs[index].likedBy.includes(userId);
    
    try {
        if (!isLiked) {
            blogs[index].likes++;
            blogs[index].likedBy.push(userId);
        } else {
            blogs[index].likes--;
            blogs[index].likedBy = blogs[index].likedBy.filter(id => id !== userId);
        }
        
        // 更新JSONBin
        await updateBlogsInJsonBin();
        displayBlogs();
        
    } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞操作失败，请重试');
    }
}

// 更新JSONBin数据
async function updateBlogsInJsonBin() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update blogs');
        }
    } catch (error) {
        throw new Error('更新数据失败');
    }
}

// 处理评论提交
async function handleComment(e) {
    e.preventDefault();
    
    const commentAuthor = document.getElementById('commentAuthor').value;
    const commentContent = document.getElementById('commentContent').value;
    
    if (!commentAuthor.trim() || !commentContent.trim()) {
        alert('请填写昵称和评论内容');
        return;
    }
    
    const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
    
    if (!blogs[blogIndex].comments) {
        blogs[blogIndex].comments = [];
    }
    
    const newComment = {
        author: commentAuthor,
        content: commentContent,
        date: new Date().toISOString()
    };
    
    try {
        blogs[blogIndex].comments.push(newComment);
        await updateBlogsInJsonBin();
        
        // 更新当前博客对象
        currentBlog = blogs[blogIndex];
        
        // 重新加载评论列表
        loadComments();
        
        // 清空表单
        document.getElementById('commentForm').reset();
        
        // 更新博客列表显示
        displayBlogs();
        
        alert('评论发表成功！');
        
    } catch (error) {
        console.error('评论提交失败:', error);
        alert('评论提交失败，请重试');
    }
}

// 生成用户ID
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
    initializeEventListeners();
});

// 页面加载时初始化
window.onload = loadBlogs;
