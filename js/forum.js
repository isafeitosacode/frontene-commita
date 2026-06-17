// js/forum.js

const token = localStorage.getItem('commita_token');
if (!token) {
    window.location.href = 'login.html';
}

// Pegar dados do usuário logado para interações
const payload = JSON.parse(atob(token.split('.')[1]));
const meuUsuarioId = payload.id;
const userData = JSON.parse(localStorage.getItem('commita_user') || '{}');
const myAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome || 'User')}&background=6c5ce7&color=fff`;

// Variáveis Globais
let forums = [];
let currentFilter = "todos";
let currentForumId = null;

// Elementos da DOM
const forumsGrid = document.getElementById("forumsGrid");
const forumSelect = document.getElementById("forumSelect");
const searchInput = document.getElementById("searchInput");
const filters = document.querySelectorAll(".filter-btn");

const forumsView = document.getElementById("forumsView");
const topicView = document.getElementById("topicView");
const topicForumTitle = document.getElementById("topicForumTitle");
const topicForumDesc = document.getElementById("topicForumDesc");
const topicList = document.getElementById("topicList");

const topicModal = document.getElementById("topicModal");
const forumModal = document.getElementById("forumModal");

window.addEventListener('load', () => {
    fetchForums();
});

// ==========================================
// INTEGRAÇÃO COM A API (NODE.JS)
// ==========================================

async function fetchForums() {
    try {
        const response = await fetch(`${API_URL}/api/forums`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            forums = await response.json();
            renderForums();
            renderForumSelect();
        }
    } catch (error) {
        console.error('Erro ao buscar fóruns:', error);
    }
}

document.getElementById("forumForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const nome = document.getElementById("forumName").value;
    const descricao = document.getElementById("forumDescription").value;
    const categoria = document.getElementById("forumCategory").value;
    const icone = document.getElementById("forumIcon").value;

    try {
        const response = await fetch(`${API_URL}/api/forums`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nome, descricao, categoria, icone })
        });

        // DEPOIS
if (response.ok) {
    closeAllModals();
    event.target.reset();
    fetchForums();
    showToast('✅ Fórum criado com sucesso!', 'success');
}
    } catch (error) {
        console.error('Erro ao criar fórum:', error);
    }
});

document.getElementById("topicForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const forumId = document.getElementById("forumSelect").value;
    const titulo = document.getElementById("topicTitle").value;
    const conteudo = document.getElementById("topicDescription").value;
    
    try {
        const response = await fetch(`${API_URL}/api/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ 
                tipo: 'Dúvida', 
                conteudo: `[${titulo}] ${conteudo}`, // Junta título e conteúdo
                forumId 
            })
        });

        if (response.ok) {
            closeAllModals();
            event.target.reset();
            fetchTopics(forumId); // Recarrega os tópicos daquele fórum na hora
            fetchForums(); // Atualiza contadores
        }
    } catch (error) {
        console.error('Erro ao criar tópico:', error);
    }
});

async function fetchTopics(forumId) {
    try {
        const response = await fetch(`${API_URL}/api/forums/${forumId}/posts`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const topics = await response.json();
            renderTopics(topics);
        } else {
            renderTopics([]);
        }
    } catch (error) {
        console.error('Erro ao buscar tópicos:', error);
        renderTopics([]);
    }
}

// ==========================================
// FUNÇÕES DE INTERAÇÃO (LIKE / COMMENT)
// ==========================================

async function handleLike(postId) {
    try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok && currentForumId) fetchTopics(currentForumId); 
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

        if (response.ok && currentForumId) fetchTopics(currentForumId); 
    } catch (error) {
        console.error('Erro ao comentar:', error);
    }
}

// ==========================================
// FUNÇÕES DE RENDERIZAÇÃO (INTERFACE)
// ==========================================

function renderForums() {
    const search = searchInput.value.toLowerCase();

    const filteredForums = forums.filter(forum => {
        const matchesFilter = currentFilter === "todos" || forum.categoria === currentFilter;
        const matchesSearch = forum.nome.toLowerCase().includes(search) || forum.descricao.toLowerCase().includes(search);
        return matchesFilter && matchesSearch;
    });

    forumsGrid.innerHTML = "";

    if (filteredForums.length === 0) {
        forumsGrid.innerHTML = `<p class="empty-message">Nenhum fórum encontrado.</p>`;
        return;
    }

    filteredForums.forEach(forum => {
        const card = document.createElement("article");
        card.className = "forum-card";

        // Agora pega os dados reais vindos do Backend!
        const topicsCount = forum.topicsCount || 0; 
        const membersCount = forum.membros ? forum.membros.length : 0;

        card.innerHTML = `
            <div class="forum-top">
                <div class="forum-icon"><i class="${forum.icone}"></i></div>
                <div>
                    <h3>${forum.nome}</h3>
                    <small style="color: var(--text-gray); text-transform: capitalize;">${forum.categoria}</small>
                </div>
            </div>
            <p>${forum.descricao}</p>
            <div class="forum-meta">
                <span><strong>${topicsCount}</strong> tópicos</span>
                <span><strong>${membersCount}</strong> membros</span>
            </div>
        `;

        card.addEventListener("click", () => openForum(forum._id));
        forumsGrid.appendChild(card);
    });
}

function renderForumSelect() {
    forumSelect.innerHTML = "";
    forums.forEach(forum => {
        const option = document.createElement("option");
        option.value = forum._id;
        option.textContent = forum.nome;
        forumSelect.appendChild(option);
    });
}

function openForum(forumId) {
    currentForumId = forumId;
    const forum = forums.find(item => item._id === forumId);

    topicForumTitle.textContent = forum.nome;
    topicForumDesc.textContent = forum.descricao;

    forumsView.style.display = "none";
    topicView.classList.add("active");

    topicList.innerHTML = `<p class="empty-message">Carregando tópicos...</p>`;
    fetchTopics(forumId);
}

function renderTopics(forumTopics) {
    topicList.innerHTML = "";

    if (forumTopics.length === 0) {
        topicList.innerHTML = `<p class="empty-message" style="text-align: center; padding: 20px;">Ainda não existem tópicos aqui. Seja a primeira pessoa a criar uma dúvida.</p>`;
        return;
    }

    forumTopics.forEach(topic => {
        const item = document.createElement("article");
        item.className = "card post";
        item.style.marginBottom = "20px";
        
        const nomeAutor = topic.autor ? topic.autor.nome : 'Usuário';
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeAutor)}&background=a29bfe&color=fff`;
        
        const euCurti = topic.curtidas?.includes(meuUsuarioId);
        const heartIcon = euCurti 
            ? `<i class="fas fa-heart" style="color: #6c5ce7;"></i>` 
            : `<i class="far fa-heart"></i>`;

        const numCurtidas = topic.curtidas ? topic.curtidas.length : 0;
        const numComentarios = topic.comentarios ? topic.comentarios.length : 0;

        const comentariosHTML = numComentarios > 0 ? `
            <div class="post-comments" style="margin-top: 15px; border-top: 1px solid #2d3436; padding-top: 15px;">
                ${topic.comentarios.map(c => `
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

        item.innerHTML = `
            <div class="post-header">
                <img src="${avatarUrl}" alt="User" style="width: 40px; height: 40px; border-radius: 50%;">
                <div class="post-author-info">
                    <h4 style="margin: 0; font-size: 15px;">${nomeAutor}</h4>
                    <span style="font-size: 12px; color: var(--text-gray);"><i class="fas fa-code-branch"></i> ${topic.tipo}</span>
                </div>
            </div>
            
            <div class="post-content" style="margin: 15px 0;">
                <p>${topic.conteudo}</p>
                ${topic.arquivos && topic.arquivos.length > 0 ? `
                    <div class="post-attachments">
                        ${topic.arquivos.map(arquivo => {
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
                <div class="post-stats" style="display: flex; gap: 15px; color: var(--text-gray); font-size: 13px; margin-bottom: 15px;">
                    <span><i class="fas fa-heart" style="color: #6c5ce7;"></i> ${numCurtidas}</span>
                    <span><i class="fas fa-comment"></i> ${numComentarios} respostas</span>
                </div>
                <div class="post-actions-buttons" style="display: flex; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    <button class="like-btn" data-id="${topic._id}" style="background:none; border:none; color:var(--text-gray); cursor:pointer;">${heartIcon} Curtir</button>
                    <button class="toggle-comment-btn" data-id="${topic._id}" style="background:none; border:none; color:var(--text-gray); cursor:pointer;"><i class="far fa-comment"></i> Responder</button>
                </div>
            </div>

            <div class="comment-input-area" id="comment-box-${topic._id}" style="display: none; margin-top: 15px; border-top: 1px solid #2d3436; padding-top: 15px; align-items: center; gap: 10px;">
                <img src="${myAvatarUrl}" style="width: 30px; height: 30px; border-radius: 50%;">
                <input type="text" id="comment-input-${topic._id}" placeholder="Escreva uma resposta..." style="flex: 1; background: #2d3436; border: 1px solid #3d4446; color: white; padding: 10px 15px; border-radius: 20px; outline: none; font-size: 13px;">
                <button class="send-comment-btn" data-id="${topic._id}" style="background: none; border: none; color: #6c5ce7; cursor: pointer; font-size: 18px; padding: 5px;"><i class="fas fa-paper-plane"></i></button>
            </div>

            ${comentariosHTML}
        `;

        topicList.appendChild(item); // <- era "container.innerHTML += postHTML", agora está correto
    });

    // Re-anexa os eventos
    document.querySelectorAll('.like-btn').forEach(btn => {
        btn.addEventListener('click', () => handleLike(btn.dataset.id));
    });
    document.querySelectorAll('.toggle-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const box = document.getElementById(`comment-box-${id}`);
            const input = document.getElementById(`comment-input-${id}`);
            box.style.display = box.style.display === 'none' ? 'flex' : 'none';
            if (box.style.display === 'flex') input.focus();
        });
    });
    document.querySelectorAll('.send-comment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const input = document.getElementById(`comment-input-${id}`);
            handleComment(id, input.value);
        });
    });
    document.querySelectorAll('[id^="comment-input-"]').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const id = input.id.replace('comment-input-', '');
                handleComment(id, input.value);
            }
        });
    });
}

// ==========================================
// SISTEMA DE TOAST (NOTIFICAÇÕES)
// ==========================================

function showToast(message, type = 'success') {
    // Remove toast anterior se existir
    const toastExistente = document.getElementById('commita-toast');
    if (toastExistente) toastExistente.remove();

    const toast = document.createElement('div');
    toast.id = 'commita-toast';

    const colors = {
        success: { bg: 'rgba(0, 210, 255, 0.12)', border: '#00d2ff', icon: '✅' },
        error:   { bg: 'rgba(255, 71, 87, 0.12)',  border: '#ff4757', icon: '❌' },
        info:    { bg: 'rgba(108, 92, 231, 0.12)', border: '#6c5ce7', icon: 'ℹ️' },
    };

    const c = colors[type] || colors.success;

    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #1a1a1a;
        border: 1px solid ${c.border};
        border-left: 4px solid ${c.border};
        color: #fff;
        padding: 14px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 260px;
        animation: slideInToast 0.3s ease;
    `;

    toast.innerHTML = `
        <span style="font-size: 18px;">${c.icon}</span>
        <span>${message}</span>
    `;

    // Injeta animação CSS se ainda não existir
    if (!document.getElementById('toast-style')) {
        const style = document.createElement('style');
        style.id = 'toast-style';
        style.textContent = `
            @keyframes slideInToast {
                from { opacity: 0; transform: translateY(20px); }
                to   { opacity: 1; transform: translateY(0); }
            }
            @keyframes slideOutToast {
                from { opacity: 1; transform: translateY(0); }
                to   { opacity: 0; transform: translateY(20px); }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Sai com animação após 3.5s
    setTimeout(() => {
        toast.style.animation = 'slideOutToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}


// ==========================================
// CONTROLE DE EVENTOS E MODAIS
// ==========================================

function closeAllModals() {
    topicModal.classList.remove("active");
    forumModal.classList.remove("active");
}

document.getElementById("backToForums").addEventListener("click", () => {
    topicView.classList.remove("active");
    forumsView.style.display = "block";
    currentForumId = null;
    fetchForums(); // Recarrega para atualizar os contadores na tela inicial
});

filters.forEach(button => {
    button.addEventListener("click", () => {
        filters.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.dataset.filter;
        renderForums();
    });
});

searchInput.addEventListener("input", renderForums);

document.getElementById("openTopicModal").addEventListener("click", () => {
    topicModal.classList.add("active");
    if (currentForumId) forumSelect.value = currentForumId;
});

document.getElementById("openForumModal").addEventListener("click", () => {
    forumModal.classList.add("active");
});

document.getElementById("closeTopicModal").addEventListener("click", closeAllModals);
document.getElementById("closeForumModal").addEventListener("click", closeAllModals);

topicModal.addEventListener("click", event => {
    if (event.target === topicModal) closeAllModals();
});

forumModal.addEventListener("click", event => {
    if (event.target === forumModal) closeAllModals();
});