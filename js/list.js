const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '6747cfdeacd3cb34a8b03128';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

let currentBlog = null;

// ... 之前的配置保持不变 ...

function loadBlogs() {
    // ... 之前的代码保持不变 ...
    blogs.forEach((blog, index) => {
        const blogItem = document.createElement('div');
        blogItem.className = 'blog-item';
        blogItem.innerHTML = `
            <h3>${blog.title}</h3>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span> | 
                <span>❤️ ${blog.likes}</span> | 
                <span>💬 ${blog.comments.length}</span>
            </div>
            <p>${blog.content.substring(0, 100)}...</p>
            <small>发布时间：${new Date(blog.date).toLocaleString()}</small>
        `;
        blogItem.onclick = () => showBlogDetail(blog, index);
        blogList.appendChild(blogItem);
    });
}

async function showBlogDetail(blog, index) {
    currentBlog = blog;
    const modal = document.getElementById('blogModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalAuthor = document.getElementById('modalAuthor');
    const modalContent = document.getElementById('modalContent');
    const modalDate = document.getElementById('modalDate');
    
    modalTitle.textContent = blog.title;
    modalAuthor.textContent = `作者：${blog.author}`;
    modalContent.innerHTML = blog.content;
    modalDate.textContent = `发布时间：${new Date(blog.date).toLocaleString()}`;
    
    // 更新点赞状态
    updateLikeButton();
    
    // 加载评论
    loadComments();
    
    modal.style.display = 'block';
}

function updateLikeButton() {
    const likeBtn = document.getElementById('likeBtn');
    const likeCount = document.getElementById('likeCount');
    const userId = localStorage.getItem('userId') || generateUserId();
    
    likeCount.textContent = currentBlog.likes;
    if (currentBlog.likedBy.includes(userId)) {
        likeBtn.classList.add('liked');
    } else {
        likeBtn.classList.remove('liked');
    }
}

function loadComments() {
    const commentList = document.getElementById('commentList');
    commentList.innerHTML = '';
    
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

// 处理点赞
document.getElementById('likeBtn').addEventListener('click', async (e) => {
    e.stopPropagation();
    const userId = localStorage.getItem('userId') || generateUserId();
    
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        const blogs = data.record.blogs;
        
        const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
        if (blogIndex === -1) return;
        
        if (!blogs[blogIndex].likedBy.includes(userId)) {
            blogs[blogIndex].likes++;
            blogs[blogIndex].likedBy.push(userId);
        } else {
            blogs[blogIndex].likes--;
            blogs[blogIndex].likedBy = blogs[blogIndex].likedBy.filter(id => id !== userId);
        }
        
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        currentBlog = blogs[blogIndex];
        updateLikeButton();
        
    } catch (error) {
        console.error('点赞失败:', error);
    }
});

// 处理评论提交
document.getElementById('commentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const commentAuthor = document.getElementById('commentAuthor').value;
    const commentContent = document.getElementById('commentContent').value;
    
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        const blogs = data.record.blogs;
        
        const blogIndex = blogs.findIndex(b => b.date === currentBlog.date);
        if (blogIndex === -1) return;
        
        const newComment = {
            author: commentAuthor,
            content: commentContent,
            date: new Date().toISOString()
        };
        
        blogs[blogIndex].comments.push(newComment);
        
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        currentBlog = blogs[blogIndex];
        loadComments();
        
        // 清空评论表单
        document.getElementById('commentForm').reset();
        
    } catch (error) {
        console.error('评论失败:', error);
    }
});

// 生成用户ID
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}
