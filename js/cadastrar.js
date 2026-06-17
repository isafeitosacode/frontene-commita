/* =====================================
   ELEMENTOS DA DOM
===================================== */
const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const btnProximo = document.getElementById("btnProximo");
const btnVoltar = document.getElementById("btnVoltar");
const form = document.getElementById("formCadastro");
const erro = document.getElementById("erro");

const circle1 = document.getElementById("circle1");
const circle2 = document.getElementById("circle2");

/* =====================================
   MOSTRAR SENHA
===================================== */
document.querySelectorAll(".toggle").forEach(icon => {
    icon.addEventListener("click", () => {
        const input = icon.previousElementSibling;
        if(input.type === "password"){
            input.type = "text";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    });
});

/* =====================================
   AVANÇAR PARA ETAPA 2
===================================== */
btnProximo.addEventListener("click", () => {
    const nome = document.getElementById("nome").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();

    erro.style.display = "none";

    if(!nome || !usuario || !email){
        erro.style.display = "block";
        erro.innerText = "Preencha todos os campos pessoais para continuar.";
        return;
    }

    // Oculta etapa 1, mostra etapa 2
    step1.style.display = "none";
    step2.style.display = "block";

    // Atualiza stepper
    circle1.classList.remove("active");
    circle2.classList.add("active");
});

/* =====================================
   VOLTAR PARA ETAPA 1
===================================== */
btnVoltar.addEventListener("click", () => {
    erro.style.display = "none";

    step2.style.display = "none";
    step1.style.display = "block";

    circle2.classList.remove("active");
    circle1.classList.add("active");
});

/* =====================================
   VALIDAÇÃO E ENVIO PARA O NODE.JS
===================================== */
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Captura todos os dados
    const nome = document.getElementById("nome").value.trim();
    const usuario = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const telefone = document.getElementById("telefone").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const confirmar = document.getElementById("confirmarSenha").value.trim();

    erro.style.display = "none";

    // Validações da Etapa 2
    if(!telefone || !senha || !confirmar){
        erro.style.display = "block";
        erro.innerText = "Preencha todos os campos.";
        return;
    }

    if(senha.length < 8){
        erro.style.display = "block";
        erro.innerText = "A senha deve ter no mínimo 8 caracteres.";
        return;
    }

    if(senha !== confirmar){
        erro.style.display = "block";
        erro.innerText = "As senhas não coincidem.";
        return;
    }

    // Objeto formatado para o backend Node.js
    const dadosCadastro = {
        nome,
        username: usuario,
        email,
        telefone,
        senha
    };

    try {
        // Envia requisição para a sua API Express
        const response = await fetch('${API_URL}/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosCadastro)
        });

        const resultado = await response.json();

        if (!response.ok) {
            erro.style.display = "block";
            erro.innerText = resultado.message || "Erro ao realizar o cadastro.";
        } else {
    // Sucesso! Salva o token e os dados do usuário, igual ao login faz
    localStorage.setItem('commita_token', resultado.token);
    localStorage.setItem('commita_user', JSON.stringify({
        nome: resultado.nome || nome,
        username: resultado.username || usuario
    }));
    window.location.href = "feed.html"; // Vai direto pro feed, não pro login
}
    } catch (e) {
        erro.style.display = "block";
        erro.innerText = "Erro de conexão com o servidor Node.js.";
        console.error(e);
    }
});