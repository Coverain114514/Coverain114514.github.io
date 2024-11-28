const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
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


// 修改处理点赞的函数
async function handleLike(index, e) {
    e.preventDefault();
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
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        // 只更新列表显示，不显示详情
        displayBlogs();
        
    } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞操作失败，请重试');
    }
}

// 修改显示博客详情的函数
// 修改显示博客列表的函数
function displayBlogs() {
    const blogList = document.getElementById('blogList');
    blogList.innerHTML = '';
    
    blogs.forEach((blog, index) => {
        const blogItem = document.createElement('div');
        blogItem.className = 'blog-item';
        blogItem.innerHTML = `
            <h3 class="blog-title">${blog.title}</h3>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span>
                <div class="action-buttons">
                    <button class="btn-like" data-index="${index}">
                        <span class="like-icon">❤️</span>
                        <span class="like-count">${blog.likes || 0}</span>
                    </button>
                    <button class="btn-comment" data-index="${index}">
                        <span class="comment-icon">💬</span>
                        <span class="comment-count">${blog.comments?.length || 0}</span>
                    </button>
                </div>
            </div>
            <p class="blog-preview">${blog.content.substring(0, 100)}...</p>
            <small>发布时间：${new Date(blog.date).toLocaleString()}</small>
        `;

        // 为标题添加点击事件
        const title = blogItem.querySelector('.blog-title');
        title.addEventListener('click', () => showBlogDetail(index));

        // 为预览文本添加点击事件
        const preview = blogItem.querySelector('.blog-preview');
        preview.addEventListener('click', () => showBlogDetail(index));

        // 为点赞按钮添加点击事件
        const likeBtn = blogItem.querySelector('.btn-like');
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleLike(index, e);
        });

        // 为评论按钮添加点击事件
        const commentBtn = blogItem.querySelector('.btn-comment');
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showBlogDetail(index, true); // 传入true表示直接跳转到评论区
        });

        blogList.appendChild(blogItem);
    });
}

// 修改显示博客详情的函数
function showBlogDetail(index, showCommentSection = false) {
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

    // 如果是从评论按钮点击进来，滚动到评论区
    if (showCommentSection) {
        setTimeout(() => {
            const commentSection = document.querySelector('.comment-section');
            if (commentSection) {
                commentSection.scrollIntoView({ behavior: 'smooth' });
                // 聚焦到评论输入框
                document.getElementById('commentContent').focus();
            }
        }, 100);
    }
}

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
    .btn-comment {
        cursor: pointer;
        background: none;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        transition: transform 0.2s;
    }

    .btn-comment:hover {
        transform: scale(1.1);
    }

    .comment-icon {
        font-size: 1.2em;
    }

    .comment-count {
        font-size: 0.9em;
        color: #666;
    }
`;
document.head.appendChild(style);
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
    
    // 创建新评论
    const newComment = {
        author: commentAuthor,
        content: commentContent,
        date: new Date().toISOString()
    };
    
    try {
        // 添加新评论
        blogs[blogIndex].comments.push(newComment);
        
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
        
        // 重新加载评论列表
        loadComments();
        
        // 清空评论表单
        document.getElementById('commentForm').reset();
        
        // 更新博客列表显示
        displayBlogs();
        
        alert('评论发表成功！');
        
    } catch (error) {
        console.error('评论提交失败:', error);
        alert('评论提交失败，请重试');
    }
}

// 加载评论列表
function loadComments() {
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';
    
    if (!currentBlog.comments) {
        currentBlog.comments = [];
    }
    
    if (currentBlog.comments.length === 0) {
        commentList.innerHTML = '<div class="no-comments">暂无评论，来发表第一条评论吧！</div>';
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

// 修改初始化事件监听器函数
function initializeEventListeners() {
    // ... 其他事件监听器保持不变 ...

    // 评论表单提交事件
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleComment);
    }
}
// 更新点赞状态的函数
function updateLikeStatus() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = likeBtn.querySelector('.like-count');
    const userId = localStorage.getItem('userId') || generateUserId();
    
    // 确保likes和likedBy存在
    if (!currentBlog.likes) currentBlog.likes = 0;
    if (!currentBlog.likedBy) currentBlog.likedBy = [];
    
    // 更新点赞数量
    likeCount.textContent = currentBlog.likes;
    
    // 更新点赞状态
    if (currentBlog.likedBy.includes(userId)) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

// 处理点赞的函数


// 初始化事件监听器
function initializeEventListeners() {
    // 点赞按钮事件
    const likeBtn = document.getElementById('likeBtn');
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }
    
    // 评论表单提交事件
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleComment);
    }
    
    // 关闭模态框
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('blogModal').style.display = 'none';
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('blogModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 页面加载时初始化
async function initialize() {
    try {
        await loadBlogs();
        initializeEventListeners();
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 确保在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initialize);
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
