import { backend } from "declarations/backend";

let quill;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Quill editor
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'header': 1 }, { 'header': 2 }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'script': 'sub'}, { 'script': 'super' }],
                [{ 'indent': '-1'}, { 'indent': '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // Load initial posts
    await loadPosts();

    // Modal handling
    const modal = document.getElementById('postModal');
    const newPostBtn = document.getElementById('newPostBtn');
    const closeBtn = document.querySelector('.close');
    const postForm = document.getElementById('postForm');

    newPostBtn.onclick = () => {
        modal.style.display = "block";
        quill.setText('');
    }

    closeBtn.onclick = () => {
        modal.style.display = "none";
    }

    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Form submission
    postForm.onsubmit = async (e) => {
        e.preventDefault();
        
        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const content = quill.root.innerHTML;

        // Show loading state
        const submitButton = postForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Publishing...';
        submitButton.disabled = true;

        try {
            await backend.createPost(title, content, author);
            modal.style.display = "none";
            postForm.reset();
            await loadPosts();
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    };
});

async function loadPosts() {
    const postsContainer = document.getElementById('posts');
    const loadingElement = document.getElementById('loading');
    
    try {
        const posts = await backend.getPosts();
        
        // Clear existing posts
        postsContainer.innerHTML = '';
        
        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        postsContainer.innerHTML = '<div class="error">Failed to load posts. Please try again later.</div>';
    } finally {
        loadingElement.style.display = 'none';
    }
}

function createPostElement(post) {
    const article = document.createElement('article');
    article.className = 'post';
    
    const date = new Date(Number(post.timestamp) / 1000000); // Convert nanoseconds to milliseconds
    
    article.innerHTML = `
        <h2 class="post-title">${post.title}</h2>
        <div class="post-meta">
            By ${post.author} • ${date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}
        </div>
        <div class="post-content">${post.body}</div>
    `;
    
    return article;
}
