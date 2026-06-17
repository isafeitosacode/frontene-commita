// js/feed.js

const token = localStorage.getItem('commita_token');
if (!token) {
    window.location.href = 'login.html';
}

const payload = JSON.parse(atob(token.split('.')[1]));
const meuUsuarioId = payload.id;

const userData = JSON.parse(localStorage.getItem('commita_user') || '{}');
const userName = userData.nome || 'Usuário';
const userHandle = userData.username ? `@${userData.username}` : 'Membro da Comunidade';
const myAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6c5ce7&color=fff`;

// Variável para guardar os posts em memória e facilitar a barra de pesquisa
let todosOsPostsAtuais = [];
let modoFeedAtual = 'feed_principal';

window.addEventListener('load', () => {
    document.getElementById('navAvatar').src = myAvatarUrl;
    document.getElementById('profileAvatar').src = myAvatarUrl;
    document.getElementById('postAvatar').src = myAvatarUrl;
    
    document.getElementById('profileName').textContent = userName;
    document.getElementById('profileSubtitle').textContent = userHandle;

    setupEventListeners();
    fetchPosts('feed_principal'); // Inicia mostrando apenas posts dos outros
    fetchUserStats();
    fetchRanking();
    fetchSuggestedForums(); // Puxa os fóruns para a barra direita
});

document.getElementById('btnSair').addEventListener('click', () => {
    localStorage.removeItem('commita_token');
    localStorage.removeItem('commita_user');
    window.location.href = 'login.html';
});

function setupEventListeners() {
    // Botão de Commitar
    const btnSubmitPost = document.getElementById('btnSubmitPost');
    if (btnSubmitPost) {
        btnSubmitPost.addEventListener('click', async () => {
            const contentInput = document.getElementById('newPostContent');
            const content = contentInput.value;
            
            if (content && content.trim()) {
                await createNewPost(content);
                contentInput.value = '';
            } else {
                alert('Escreva algo antes de commitar!');
            }
        });
    }

    // Funcionalidade do Botão de Upload (+)
    const btnAttachment = document.getElementById('btnAttachment');
    const fileUpload = document.getElementById('fileUpload');
    if (btnAttachment && fileUpload) {
        btnAttachment.addEventListener('click', () => fileUpload.click());
        
        fileUpload.addEventListener('change', () => {
    if (fileUpload.files.length > 0) {
        const nomes = Array.from(fileUpload.files).map(f => f.name).join(', ');
        const textarea = document.getElementById('newPostContent');
        // Mostra os nomes dos arquivos como dica visual no placeholder
        textarea.placeholder = `📎 ${nomes}\n\nAdicione uma descrição para o commit...`;
    }
});
    }

    // Toggle Menu do Usuário
    const userAvatar = document.querySelector('.user-avatar');
    const userMenu = document.getElementById('userMenu');
    if (userAvatar && userMenu) {
        userAvatar.addEventListener('click', (e) => {
            e.preventDefault();
            userMenu.style.display = userMenu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
            if (e.target !== userAvatar && !userMenu.contains(e.target)) {
                userMenu.style.display = 'none';
            }
        });
    }

    // Trocar entre Feed Principal e Meus Commits
    const btnMeusCommits = document.getElementById('menuMeusCommits');
    const btnHome = document.querySelector('.nav-links a.active'); // Botão Feed na navbar
    
    if (btnMeusCommits) {
        btnMeusCommits.addEventListener('click', (e) => {
            e.preventDefault();
            modoFeedAtual = 'meus_commits';
            document.querySelector('.create-post').style.display = 'none'; // Esconde caixa de criar
            fetchPosts(modoFeedAtual);
        });
    }

    if (btnHome) {
        btnHome.addEventListener('click', (e) => {
            e.preventDefault();
            modoFeedAtual = 'feed_principal';
            document.querySelector('.create-post').style.display = 'block'; // Mostra caixa
            fetchPosts(modoFeedAtual);
        });
    }

    // Barra de Busca Global
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', (e) => {
            const termo = e.target.value.toLowerCase();
            const postsFiltrados = todosOsPostsAtuais.filter(post => 
                post.conteudo.toLowerCase().includes(termo) || 
                (post.autor && post.autor.nome.toLowerCase().includes(termo)) ||
                post.tipo.toLowerCase().includes(termo)
            );
            renderPostsOnScreen(postsFiltrados);
        });
    }
}

// Adicione esta função nova
function renderFeedHeader(modo) {
    // Remove banner anterior se existir
    const bannerAnterior = document.getElementById('feed-mode-banner');
    if (bannerAnterior) bannerAnterior.remove();

    if (modo === 'meus_commits') {
        const banner = document.createElement('div');
        banner.id = 'feed-mode-banner';
        banner.innerHTML = `
            <div class="feed-banner">
                <div class="feed-banner-left">
                    <i class="fas fa-code-branch"></i>
                    <div>
                        <span class="feed-banner-title">Meus Commits</span>
                        <span class="feed-banner-sub">Tudo que você publicou na comunidade</span>
                    </div>
                </div>
                <button id="btnVoltarFeed">
                    <i class="fas fa-arrow-left"></i> Voltar ao Feed
                </button>
            </div>
        `;
        const postsContainer = document.getElementById('posts-container');
        postsContainer.parentNode.insertBefore(banner, postsContainer);

        document.getElementById('btnVoltarFeed').addEventListener('click', () => {
            modoFeedAtual = 'feed_principal';
            document.querySelector('.create-post').style.display = 'block';
            renderFeedHeader('feed_principal'); // Remove o banner
            fetchPosts('feed_principal');
        });
    }
}

async function fetchPosts(modo) {
    try {
        const response = await fetch(`${API_URL}/api/posts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Falha ao carregar posts');

        let posts = await response.json();

        // Lógica dos filtros
        if (modo === 'feed_principal') {
            // Remove os commits do próprio usuário logado
            posts = posts.filter(post => post.autor && post.autor._id !== meuUsuarioId);
        } else if (modo === 'meus_commits') {
            // Mostra APENAS os commits do usuário logado
            posts = posts.filter(post => post.autor && post.autor._id === meuUsuarioId);
        }

        todosOsPostsAtuais = posts; // Salva para a barra de pesquisa
                renderFeedHeader(modo); // <-- adicione esta linha
        renderPostsOnScreen(posts);

    } catch (error) {
        console.error('Erro ao buscar posts:', error);
        document.getElementById('posts-container').innerHTML = '<p style="color: red; text-align: center;">Erro ao carregar o feed.</p>';
    }
}

// Extraímos a renderização para uma função separada para facilitar a Busca
function renderPostsOnScreen(posts) {
    const container = document.getElementById('posts-container');
    container.innerHTML = '';

    if (posts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #b2bec3;">Nenhum commit encontrado por aqui.</p>';
        return;
    }

    posts.forEach(post => {
        const nomeAutor = post.autor ? post.autor.nome : 'Usuário Desconhecido';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeAutor)}&background=a29bfe&color=fff`;
        
        const euCurti = post.curtidas.includes(meuUsuarioId);
        const heartIcon = euCurti ? `<i class="fas fa-heart" style="color: #6c5ce7;"></i>` : `<i class="far fa-heart"></i>`;

        const comentariosHTML = post.comentarios.length > 0 ? `
            <div class="post-comments" style="margin-top: 15px; border-top: 1px solid #2d3436; padding-top: 15px;">
                ${post.comentarios.map(c => `
                    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(c.autor?.nome || 'User')}&background=a29bfe&color=fff" style="width: 28px; height: 28px; border-radius: 50%;">
                        <div style="background: #2d3436; padding: 8px 12px; border-radius: 8px; flex: 1;">
                            <strong style="color: #00d2ff; font-size: 13px;">${c.autor?.nome || 'User'}</strong>
                            <p style="font-size: 13px; color: #d8d8d8; margin-top: 2px;">${c.texto}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '';
        
        const postHTML = `
            <article class="card post">
                <div class="post-header">
                    <img src="${avatarUrl}" alt="User">
                    <div class="post-author-info">
                        <h4>${nomeAutor}</h4>
                        <span><i class="fas fa-code-branch"></i> ${post.tipo}</span>
                    </div>
                    <button class="more-options"><i class="fas fa-ellipsis-h"></i></button>
                </div>
                
                <div class="post-content">
                    <p>${post.conteudo}</p>
                    ${post.arquivos && post.arquivos.length > 0 ? `
                        <div class="post-attachments">
                            ${post.arquivos.map(arquivo => {
                                if (arquivo.tipo && arquivo.tipo.startsWith('image/')) {
                                    return `<img src="${API_URL}${arquivo.url}" alt="${arquivo.nome}" class="attachment-image">`;
                                } else if (arquivo.tipo && arquivo.tipo.startsWith('video/')) {
                                    return `<video controls class="attachment-video">
                                                <source src="${API_URL}${arquivo.url}" type="${arquivo.tipo}">
                                            </video>`;
                                } else {
                                    return `<a href="${API_URL}${arquivo.url}" target="_blank" class="attachment-file">
                                                <i class="fas fa-file-code"></i> ${arquivo.nome}
                                            </a>`;
                                }
                            }).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="post-footer">
                    <div class="post-stats">
                        <span><i class="fas fa-heart" style="color: #6c5ce7;"></i> ${post.curtidas.length}</span>
                        <span><i class="fas fa-comment"></i> ${post.comentarios.length} comentários</span>
                    </div>
                    <div class="post-actions-buttons">
                        <button class="like-btn" data-id="${post._id}">${heartIcon} Curtir</button>
                        <button class="toggle-comment-btn" data-id="${post._id}"><i class="far fa-comment"></i> Comentar</button>
                        <button><i class="fas fa-share"></i> Compartilhar</button>
                    </div>
                </div>

                <div class="comment-input-area" id="comment-box-${post._id}" style="display: none; margin-top: 15px; border-top: 1px solid #2d3436; padding-top: 15px; align-items: center; gap: 10px;">
                    <img src="${myAvatarUrl}" style="width: 30px; height: 30px; border-radius: 50%;">
                    <input type="text" id="comment-input-${post._id}" placeholder="Escreva um comentário..." style="flex: 1; background: #2d3436; border: 1px solid #3d4446; color: white; padding: 10px 15px; border-radius: 20px; outline: none; font-size: 13px;">
                    <button class="send-comment-btn" data-id="${post._id}" style="background: none; border: none; color: #6c5ce7; cursor: pointer; font-size: 18px; padding: 5px;"><i class="fas fa-paper-plane"></i></button>
                </div>

                ${comentariosHTML}
            </article>
        `;
        container.innerHTML += postHTML;
    });

    // Re-anexa os eventos
    document.querySelectorAll('.like-btn').forEach(btn => btn.addEventListener('click', () => handleLike(btn.dataset.id)));
    document.querySelectorAll('.toggle-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const box = document.getElementById(`comment-box-${id}`);
            const input = document.getElementById(`comment-input-${id}`);
            box.style.display = box.style.display === 'none' ? 'flex' : 'none';
            if(box.style.display === 'flex') input.focus();
        });
    });
    document.querySelectorAll('.send-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => handleComment(btn.dataset.id, document.getElementById(`comment-input-${btn.dataset.id}`).value));
    });
    document.querySelectorAll('[id^="comment-input-"]').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleComment(input.id.replace('comment-input-', ''), input.value);
        });
    });
}

// Substitua a função createNewPost inteira
async function createNewPost(texto) {
    const tagSelecionadaInput = document.querySelector('input[name="postTag"]:checked');
    const tagSelecionada = tagSelecionadaInput ? tagSelecionadaInput.value : 'Snippet';
    const fileUpload = document.getElementById('fileUpload');

    // Usa FormData para suportar arquivos
    const formData = new FormData();
    formData.append('tipo', tagSelecionada);
    formData.append('conteudo', texto);

    if (fileUpload.files.length > 0) {
        Array.from(fileUpload.files).forEach(file => {
            formData.append('arquivos', file);
        });
    }

    try {
        const response = await fetch('${API_URL}/api/posts', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Não coloque Content-Type aqui! O FormData define automaticamente
            },
            body: formData
        });

        if (response.ok) {
            fileUpload.value = ''; // Limpa os arquivos selecionados
            modoFeedAtual = 'feed_principal';
            fetchPosts(modoFeedAtual);
            fetchUserStats();
            fetchRanking();
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
    }
}

async function handleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            fetchPosts(modoFeedAtual); 
            fetchRanking(); 
        }
    } catch (error) {
        console.error('Erro ao curtir:', error);
    }
}

async function handleComment(postId, texto) {
    if (!texto || !texto.trim()) return;
    try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ texto: texto.trim() })
        });
        if (response.ok) {
            fetchPosts(modoFeedAtual); 
            fetchUserStats(); 
            fetchRanking();   
        }
    } catch (error) {
        console.error('Erro ao comentar:', error);
    }
}

async function fetchUserStats() {
    try {
        const response = await fetch(`${API_URL}/api/users/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            const el = document.getElementById('statContribuicoes');
            if(el) el.textContent = data.contribuicoes;
        }
    } catch (error) {
        console.error("Erro ao buscar estatísticas.");
    }
}

async function fetchRanking() {
    try {
        const response = await fetch(`${API_URL}/api/users/ranking`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const rankingData = await response.json();
            const rankingList = document.querySelector('.ranking-list');
            if(!rankingList) return;
            rankingList.innerHTML = '';
            rankingData.forEach((user, index) => {
                const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=a29bfe&color=fff`;
                rankingList.innerHTML += `
                    <li>
                        <span class="rank">${index + 1}</span>
                        <img src="${avatar}" alt="User">
                        <div class="rank-info">
                            <span class="name">${user.nome}</span>
                            <span class="points">${user.pontos} pts</span>
                        </div>
                    </li>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao buscar ranking.");
    }
}

// NOVA FUNÇÃO: Busca 3 fóruns do backend para sugerir na lateral direita
async function fetchSuggestedForums() {
    try {
        const response = await fetch(`${API_URL}/api/forums`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const forums = await response.json();
            const list = document.getElementById('suggestedForumsList');
            if(!list) return;
            
            list.innerHTML = '';
            
            // Pega apenas os 3 primeiros fóruns criados
            const top3 = forums.slice(0, 3);
            
            if (top3.length === 0) {
                list.innerHTML = '<p style="text-align: center; color: var(--text-gray); font-size: 13px;">Nenhum fórum ainda.</p>';
                return;
            }

            top3.forEach(forum => {
                const numMembros = forum.membros ? forum.membros.length : 0;
                list.innerHTML += `
                    <li>
                        <div class="group-icon"><i class="${forum.icone || 'fas fa-code'}"></i></div>
                        <div class="suggestion-info">
                            <span class="name">${forum.nome}</span>
                            <span class="members">${numMembros} membros</span>
                        </div>
                        <button class="join-btn" onclick="window.location.href='forum.html'">Ver</button>
                    </li>
                `;
            });
        }
    } catch (error) {
        console.error("Erro ao buscar fóruns sugeridos.");
    }
}