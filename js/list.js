const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '67481f67acd3cb34a8b0577b';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

let blogs = [];
let currentBlog = null;

// 从 JSONBin 加载博客数据
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
        document.getElementById('blogList').innerHTML = 
            `<p>加载失败，请刷新页面重试。错误信息：${error.message}</p>`;
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
            <h2 class="blog-title">${blog.title}</h2>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span>
                <span>发布时间: ${new Date(blog.date).toLocaleString()}</span>
            </div>
            <p class="blog-preview">${blog.content.substring(0, 100)}...</p>
            <div class="blog-actions">
                <span>❤️ ${blog.likes || 0}</span>
                <span>💬 ${blog.comments?.length || 0}</span>
            </div>
        `;
        
        blogItem.addEventListener('click', () => showBlogDetail(index));
        blogList.appendChild(blogItem);
    });
}

// 显示博客详情
function showBlogDetail(index) {
    currentBlog = blogs[index];
    const modal = document.getElementById('blogModal');
    
    document.getElementById('modalTitle').textContent = currentBlog.title;
    document.getElementById('modalAuthor').textContent = `作者：${currentBlog.author}`;
    document.getElementById('modalDate').textContent = 
        `发布时间：${new Date(currentBlog.date).toLocaleString()}`;
    document.getElementById('modalContent').innerHTML = currentBlog.content;
    
    updateLikeButton();
    loadComments();
    
    modal.style.display = 'block';
}

// 更新点赞按钮状态
function updateLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = likeBtn.querySelector('.like-count');
    const userId = localStorage.getItem('userId') || generateUserId();
    
    likeCount.textContent = currentBlog.likes || 0;
    
    if (currentBlog.likedBy?.includes(userId)) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

// 处理点赞
async function handleLike() {
    const userId = localStorage.getItem('userId') || generateUserId();
    const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
    
    if (!blogs[blogIndex].likedBy) blogs[blogIndex].likedBy = [];
    if (!blogs[blogIndex].likes) blogs[blogIndex].likes = 0;
    
    const isLiked = blogs[blogIndex].likedBy.includes(userId);
    
    try {
        if (!isLiked) {
            blogs[blogIndex].likes++;
            blogs[blogIndex].likedBy.push(userId);
        } else {
            blogs[blogIndex].likes--;
            blogs[blogIndex].likedBy = blogs[blogIndex].likedBy.filter(id => id !== userId);
        }
        
        await updateBlogsInJsonBin();
        currentBlog = blogs[blogIndex];
        updateLikeButton();
        displayBlogs();
    } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞操作失败，请重试');
    }
}

// 加载评论列表
function loadComments() {
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';
    
    if (!currentBlog.comments || currentBlog.comments.length === 0) {
        commentList.innerHTML = '<p>暂无评论</p>';
        return;
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
        
        currentBlog = blogs[blogIndex];
        loadComments();
        displayBlogs();
        
        // 清空表单
        document.getElementById('commentForm').reset();
        
        alert('评论发表成功！');
    } catch (error) {
        console.error('评论提交失败:', error);
        alert('评论提交失败，请重试');
    }
}

// 更新 JSONBin 数据
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
        throw error;
    }
}

// 生成用户ID
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}

// 初始化事件监听器
function initializeEventListeners() {
    // 关闭按钮
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
    
    // 点赞按钮
    document.getElementById('likeBtn').onclick = handleLike;
    
    // 评论表单
    document.getElementById('commentForm').onsubmit = handleComment;
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
    loadBlogs();
    initializeEventListeners();
});
