const API_KEY = '$2a$10$nX0PT8wbblMuHpGyw.iCWOwHCuzlcqdZBy9A8BjmEvyCpGrWm7Eay';
const BIN_ID = '6747cfdeacd3cb34a8b03128';
const BASE_URL = 'https://api.jsonbin.io/v3/b';

document.getElementById('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const content = document.getElementById('content').value;
    
    try {
        const response = await fetch(`${BASE_URL}/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        const data = await response.json();
        const blogs = data.record.blogs || [];
        
        // 添加新博客，包含作者、点赞数和评论数组
        blogs.push({
            title,
            author,
            content,
            date: new Date().toISOString(),
            likes: 0,
            likedBy: [], // 记录点赞的用户
            comments: [] // 存储评论
        });
        
        await fetch(`${BASE_URL}/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ blogs })
        });
        
        alert('博客发布成功！');
        window.location.href = 'list.html';
        
    } catch (error) {
        console.error('发布失败:', error);
        alert('发布失败，请重试');
    }
});
