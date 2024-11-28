// API 配置
const API_CONFIG = {
    url: 'https://api.jsonbin.io/v3/b/6747cfdeacd3cb34a8b03128', // 替换为你的 BIN ID
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$ZfWNgnKO6UkPdcgrP./iwOCZEhJhmid0yXdRIMJgp9GQT307tbJ9G', // 替换为你的 API KEY
        'X-Bin-Meta': false
    }
};


// 显示/隐藏加载动画
function toggleLoading(show) {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = show ? 'block' : 'none';
    }
}

// 提交博客
async function submitBlog(event) {
    event.preventDefault();
    
    const title = document.getElementById('blogTitle').value;
    const category = document.getElementById('blogCategory').value;
    const content = document.getElementById('blogContent').value;
    
    try {
        toggleLoading(true);
        
        // 获取现有博客列表
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) throw new Error('获取数据失败');
        
        let blogs = await response.json();
        if (!Array.isArray(blogs)) blogs = [];
        
        // 创建新博客
        const newBlog = {
            id: Date.now(),
            title,
            category,
            content,
            date: new Date().toLocaleString(),
            author: '匿名用户', // 可以改为实际的用户名
            likes: 0,
            comments: []
        };
        
        // 添加到博客列表
        blogs.unshift(newBlog);
        
        // 更新数据
        const updateResponse = await fetch(API_CONFIG.url, {
            method: 'PUT',
            headers: API_CONFIG.headers,
            body: JSON.stringify(blogs)
        });
        
        if (!updateResponse.ok) throw new Error('发布失败');
        
        alert('博客发布成功！');
        window.location.href = 'list.html'; // 发布成功后跳转到博客列表
        
    } catch (error) {
        console.error('Error:', error);
        alert('发布失败，请稍后重试');
    } finally {
        toggleLoading(false);
    }
}

// 如果在博客列表页面，则加载博客列表
async function loadBlogs() {
    if (!document.getElementById('blogList')) return;
    
    try {
        toggleLoading(true);
        
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) throw new Error('获取数据失败');
        
        const blogs = await response.json();
        displayBlogs(blogs || []);
        
    } catch (error) {
        console.error('Error:', error);
        alert('获取博客列表失败，请稍后重试');
    } finally {
        toggleLoading(false);
    }
}

// 显示博客列表
function displayBlogs(blogs) {
    const blogList = document.getElementById('blogList');
    if (!blogList) return;
    
    blogList.innerHTML = blogs.map(blog => `
        <article class="blog-card">
            <h2>${blog.title}</h2>
            <div class="blog-meta">
                <span>作者: ${blog.author}</span>
                <span>分类: ${blog.category}</span>
                <span>发布于: ${blog.date}</span>
            </div>
            <div class="blog-content">
                ${blog.content}
            </div>
            <div class="blog-actions">
                <button onclick="likeBlog(${blog.id})">
                    👍 ${blog.likes}
                </button>
                <button onclick="showComments(${blog.id})">
                    💬 ${blog.comments.length}
                </button>
            </div>
        </article>
    `).join('');
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    // 如果在博客列表页面，加载博客列表
    if (document.getElementById('blogList')) {
        loadBlogs();
    }
});

function filterBlogs() {
    const category = document.getElementById('categoryFilter').value;
    const blogList = document.getElementById('blogList');
    const blogs = Array.from(blogList.children);
    
    blogs.forEach(blog => {
        const blogCategory = blog.querySelector('.blog-meta').textContent;
        if (category === 'all' || blogCategory.includes(category)) {
            blog.style.display = 'block';
        } else {
            blog.style.display = 'none';
        }
    });
}

// 显示评论模态框
function showComments(blogId) {
    const modal = document.getElementById('commentModal');
    modal.style.display = 'block';
    modal.dataset.blogId = blogId;
    
    // 加载评论
    loadComments(blogId);
}

// 加载评论
async function loadComments(blogId) {
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        const blogs = await response.json();
        const blog = blogs.find(b => b.id === blogId);
        
        if (blog) {
            const commentsList = document.getElementById('commentsList');
            commentsList.innerHTML = blog.comments.map(comment => `
                <div class="comment">
                    <p>${comment.text}</p>
                    <small>${comment.date}</small>
                </div>
            `).join('') || '<p>暂无评论</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('加载评论失败');
    }
}

// 提交评论
async function submitComment(event) {
    event.preventDefault();
    
    const modal = document.getElementById('commentModal');
    const blogId = parseInt(modal.dataset.blogId);
    const commentText = document.getElementById('commentText').value;
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        const blogs = await response.json();
        const blog = blogs.find(b => b.id === blogId);
        
        if (blog) {
            blog.comments.push({
                text: commentText,
                date: new Date().toLocaleString()
            });
            
            await fetch(API_CONFIG.url, {
                method: 'PUT',
                headers: API_CONFIG.headers,
                body: JSON.stringify(blogs)
            });
            
            // 重新加载评论
            loadComments(blogId);
            document.getElementById('commentText').value = '';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('提交评论失败');
    }
}

// 关闭模态框
document.querySelector('.close').onclick = function() {
    document.getElementById('commentModal').style.display = 'none';
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const modal = document.getElementById('commentModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
