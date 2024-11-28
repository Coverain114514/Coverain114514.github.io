const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '6747cfdeacd3cb34a8b03128';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

// 加载博客列表
async function loadBlogs() {
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        const blogs = data.record.blogs || [];
        
        const blogList = document.getElementById('blogList');
        blogList.innerHTML = '';
        
        blogs.forEach((blog, index) => {
            const blogItem = document.createElement('div');
            blogItem.className = 'blog-item';
            blogItem.innerHTML = `
                <h3>${blog.title}</h3>
                <p>${blog.content.substring(0, 100)}...</p>
                <small>发布时间：${new Date(blog.date).toLocaleString()}</small>
            `;
            blogItem.onclick = () => showBlogDetail(blog);
            blogList.appendChild(blogItem);
        });
    } catch (error) {
        console.error('加载博客失败:', error);
        document.getElementById('blogList').innerHTML = '<p>加载失败，请刷新页面重试</p>';
    }
}

// 显示博客详情
function showBlogDetail(blog) {
    const modal = document.getElementById('blogModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');
    const modalDate = document.getElementById('modalDate');
    
    modalTitle.textContent = blog.title;
    modalContent.innerHTML = blog.content;
    modalDate.textContent = `发布时间：${new Date(blog.date).toLocaleString()}`;
    
    modal.style.display = 'block';
}

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