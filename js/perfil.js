// js/perfil.js

const token = localStorage.getItem('commita_token');
if (!token) {
    window.location.href = 'login.html';
}

// Variável para guardar os dados originais do banco e fazer a comparação depois
let dadosOriginais = {};

// Elementos da DOM - Preview Visual
const previewName = document.getElementById("previewName");
const previewUsername = document.getElementById("previewUsername");
const previewBio = document.getElementById("previewBio");
const avatarPreview = document.getElementById("avatarPreview");

// Elementos da DOM - Inputs do Formulário
const nameInput = document.getElementById("name");
const usernameInput = document.getElementById("username");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const bioInput = document.getElementById("bio");

// Carregar dados assim que a página abrir
window.addEventListener('load', () => {
    fetchUserData();
    fetchUserStats(); // <-- Busca as contribuições reais ao carregar a página
});

// Busca os dados reais do usuário logado no Node.js
async function fetchUserData() {
    try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const user = await response.json();
            
            // Guarda a cópia exata do que veio do banco!
            dadosOriginais = user;
            
            // Atualiza os Textos Visuais
            previewName.textContent = user.nome;
            previewUsername.textContent = `@${user.username}`;
            previewBio.textContent = user.bio || "Adicione uma bio para que a comunidade te conheça melhor.";
            
            // Avatar
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=6c5ce7&color=fff`;
            avatarPreview.src = avatarUrl;

            // Preenche os Inputs do formulário de edição
            nameInput.value = user.nome;
            usernameInput.value = user.username;
            emailInput.value = user.email;
            phoneInput.value = user.telefone || '';
            bioInput.value = user.bio || '';
        }
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
    }
}

// Salvar as alterações do Perfil
document.getElementById("profileForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const btn = document.getElementById("btnSalvarPerfil");
    btn.textContent = "Salvando...";

    // Cria um objeto vazio para receber APENAS o que mudou
    const dadosAtualizados = {};

    if (nameInput.value !== dadosOriginais.nome) {
        dadosAtualizados.nome = nameInput.value;
    }
    if (usernameInput.value !== dadosOriginais.username) {
        dadosAtualizados.username = usernameInput.value;
    }
    if (phoneInput.value !== (dadosOriginais.telefone || '')) {
        dadosAtualizados.telefone = phoneInput.value;
    }
    if (bioInput.value !== (dadosOriginais.bio || '')) {
        dadosAtualizados.bio = bioInput.value;
    }

    // Verifica se houve alguma alteração real
    if (Object.keys(dadosAtualizados).length === 0) {
        alert("Nenhuma informação foi alterada.");
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
        return; // Para a função aqui e não faz a requisição
    }

    try {
        const response = await fetch(`${API_URL}/api/users/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(dadosAtualizados)
        });

        if (response.ok) {
            const user = await response.json();
            
            // Atualiza nossa referência original para permitir novas edições sem recarregar a tela
            dadosOriginais = user;
            
            // Atualiza o visual
            previewName.textContent = user.nome;
            previewUsername.textContent = `@${user.username}`;
            previewBio.textContent = user.bio || "Adicione uma bio para que a comunidade te conheça melhor.";
            
            // Atualiza o nome salvo no cache do navegador (pra ficar certo no Feed e Fórum)
            const cache = JSON.parse(localStorage.getItem('commita_user') || '{}');
            cache.nome = user.nome;
            cache.username = user.username;
            localStorage.setItem('commita_user', JSON.stringify(cache));

            // Atualiza o avatar caso o nome tenha mudado
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome)}&background=6c5ce7&color=fff`;
            avatarPreview.src = avatarUrl;

            alert("Perfil atualizado com sucesso!");
        } else {
            alert("Erro ao atualizar o perfil. O nome de usuário pode já estar em uso.");
        }
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
    } finally {
        btn.innerHTML = '<i class="fas fa-save"></i> Salvar Alterações';
    }
});

// Alterar Senha
document.getElementById("passwordForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    if (password.length < 8) {
        alert("A senha precisa ter no mínimo 8 caracteres.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/users/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ senha: password })
        });

        if (response.ok) {
            alert("Senha alterada com sucesso!");
            document.getElementById("passwordForm").reset();
        } else {
            alert("Erro ao alterar a senha.");
        }
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
    }
});

// Excluir Conta
document.getElementById("deleteAccount").addEventListener("click", async () => {
    const confirmDelete = confirm("Tem certeza ABSOLUTA que deseja excluir sua conta? Isso apagará todos os seus posts e não pode ser desfeito.");

    if (confirmDelete) {
        try {
            const response = await fetch(`${API_URL}/api/users/profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert("Conta excluída com sucesso. Adeus!");
                localStorage.removeItem('commita_token');
                localStorage.removeItem('commita_user');
                window.location.href = 'cadastrar.html'; // Manda de volta pro início
            } else {
                alert("Erro ao tentar excluir a conta.");
            }
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
        }
    }
});

// Busca as Contribuições Reais do Usuário
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
        console.error("Erro ao buscar estatísticas do perfil.");
    }
}