// js/login.js

const form = document.getElementById('formLogin');
const erro = document.getElementById('erro');
const sucesso = document.getElementById('sucesso');

// Verificar se já está logado assim que a página carrega
window.addEventListener('load', () => {
    // Se existir um token salvo, manda o usuário direto para o feed
    const token = localStorage.getItem('commita_token');
    if (token) {
        window.location.href = 'feed.html';
    }
});

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value.trim();

    erro.style.display = 'none';
    sucesso.style.display = 'none';

    if (!email || !senha) {
        erro.style.display = 'block';
        erro.textContent = 'Preencha todos os campos.';
        return;
    }

    try {
        // Dispara a requisição para o nosso backend Node.js
        const response = await fetch('${API_URL}/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const resultado = await response.json();

        if (!response.ok) {
            erro.style.display = 'block';
            erro.textContent = resultado.message || 'Erro ao realizar login.';
        } else {
            // Se o login der certo, salva o token e os dados do usuário
            localStorage.setItem('commita_token', resultado.token);
            localStorage.setItem('commita_user', JSON.stringify({
                nome: resultado.nome,
                username: resultado.username
            }));

            sucesso.style.display = 'block';
            sucesso.textContent = "Login realizado com sucesso! Redirecionando...";
            
            setTimeout(() => {
                window.location.href = 'feed.html';
            }, 1500);
        }
    } catch (error) {
        erro.style.display = 'block';
        erro.textContent = 'Erro de conexão com o servidor Node.js.';
        console.error(error);
    }
});