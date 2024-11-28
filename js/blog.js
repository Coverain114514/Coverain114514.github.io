// API 配置
const API_CONFIG = {
    url: 'https://api.jsonbin.io/v3/b/6747c8c19fd07d161ce49649', // 替换为你的 BIN ID
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$ZfWNgnKO6UkPdcgrP./iwOCZEhJhmid0yXdRIMJgp9GQT307tbJ9G', // 替换为你的 API KEY
        'X-Bin-Meta': false
    }
};

// 显示/隐藏加载动画
function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

// 获取所有文章
async function fetchPosts() {
    try {
        toggleLoading(true);
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        if (!response.ok) throw new Error('获取数据失败');
        
        const posts = await response.json();
        displayPosts(posts || []);
    } catch (error) {
        console.error('Error:', error);
        alert('获取文章失败，请稍后重试');
    } finally {
        toggleLoading(false);
    }
}

// 更新文章数据
async function updatePosts(posts) {
    try {
        toggleLoading(true);
        const response = await fetch(API_CONFIG.url, {
            method: 'PUT',
            headers: API_CONFIG.headers,
            body: JSON.stringify(posts)
        });
        
        if (!response.ok) throw new Error('更新数据失败');
        
        return true;
    } catch (error) {
        console.error('Error:', error);
        alert('更新失败，请稍后重试');
        return false;
    } finally {
        toggleLoading(false);
    }
}

// 显示发布文章表单
function showAddPost() {
    document.getElementById('addPostForm').classList.remove('hidden');
}

// 添加新文章
async function addPost(event) {
    event.preventDefault();
    
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    
    try {
        toggleLoading(true);
        
        // 获取当前文章列表
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        const posts = await response.json() || [];
        
        // 添加新文章
        const newPost = {
            id: Date.now(),
            title,
            content,
            date: new Date().toLocaleString(),
            likes: 0,
            comments: []
        };
        
        posts.unshift(newPost);
        
        // 更新数据
        const success = await updatePosts(posts);
        
        if (success) {
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('addPostForm').classList.add('hidden');
            fetchPosts();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('发布失败，请稍后重试');
    }
}

// 显示文章列表
function displayPosts(posts) {
    const postsDiv = document.getElementById('postsList');
    
    postsDiv.innerHTML = posts.map(post => `
        <article class="post" data-id="${post.id}">
            <h2>${post.title}</h2>
            <div class="post-meta">发布于: ${post.date}</div>
            <div class="post-content">${post.content}</div>
            <div class="post-actions">
                <button onclick="likePost(${post.id})">
                    👍 ${post.likes}
                </button>
                <button onclick="showComments(${post.id})">
                    💬 ${post.comments.length}
                </button>
            </div>
            <div class="comments-section hidden" id="comments-${post.id}">
                <div class="comments-list">
                    ${post.comments.map(comment => `
                        <div class="comment">
                            <p>${comment.text}</p>
                            <small>${comment.date}</small>
                        </div>
                    `).join('')}
                </div>
                <form onsubmit="addComment(event, ${post.id})">
                    <input type="text" placeholder="添加评论" required>
                    <button type="submit">发送</button>
                </form>
            </div>
        </article>
    `).join('');
}

// 点赞功能
async function likePost(postId) {
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        const posts = await response.json();
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            post.likes += 1;
            const success = await updatePosts(posts);
            if (success) {
                fetchPosts();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('点赞失败，请稍后重试');
    }
}

// 显示评论
function showComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('hidden');
}

// 添加评论
async function addComment(event, postId) {
    event.preventDefault();
    const input = event.target.querySelector('input');
    const commentText = input.value;
    
    try {
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });
        
        const posts = await response.json();
        const post = posts.find(p => p.id === postId);
        
        if (post) {
            post.comments.push({
                text: commentText,
                date: new Date().toLocaleString()
            });
            
            const success = await updatePosts(posts);
            if (success) {
                input.value = '';
                fetchPosts();
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('评论失败，请稍后重试');
    }
}

// 页面加载时获取文章
document.addEventListener('DOMContentLoaded', fetchPosts);