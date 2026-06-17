// Arquivo para gerenciar requisições ao backend
// Detecta a URL base automaticamente
const API_BASE = window.location.pathname.includes('/Frontend/') 
    ? '../../Backend' 
    : './Backend';

class API {
    
    // ========================================
    // AUTENTICAÇÃO
    // ========================================
    
    static async cadastro(dados) {
        const formData = new FormData();
        formData.append('action', 'cadastro');
        formData.append('nome', dados.nome);
        formData.append('usuario', dados.usuario);
        formData.append('email', dados.email);
        formData.append('telefone', dados.telefone);
        formData.append('senha', dados.senha);
        formData.append('confirmarSenha', dados.confirmarSenha);
        
        try {
            const response = await fetch(`${API_BASE}/auth.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async login(usuario, senha) {
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('usuario', usuario);
        formData.append('senha', senha);
        
        try {
            const response = await fetch(`${API_BASE}/auth.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async logout() {
        const formData = new FormData();
        formData.append('action', 'logout');
        
        try {
            const response = await fetch(`${API_BASE}/auth.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async verificarSessao() {
        const formData = new FormData();
        formData.append('action', 'verificar');
        
        try {
            const response = await fetch(`${API_BASE}/auth.php`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    // ========================================
    // POSTS
    // ========================================
    
    static async criarPost(conteudo) {
        const formData = new FormData();
        formData.append('action', 'criar');
        formData.append('conteudo', conteudo);
        
        try {
            const response = await fetch(`${API_BASE}/posts.php?action=criar`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async listarPosts() {
        try {
            const response = await fetch(`${API_BASE}/posts.php?action=listar`, {
                method: 'GET',
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async adicionarComentario(postId, conteudo) {
        const formData = new FormData();
        formData.append('action', 'comentar');
        formData.append('post_id', postId);
        formData.append('conteudo', conteudo);
        
        try {
            const response = await fetch(`${API_BASE}/posts.php?action=comentar`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
    
    static async deletarPost(postId) {
        const formData = new FormData();
        formData.append('post_id', postId);
        
        try {
            const response = await fetch(`${API_BASE}/posts.php?action=deletar`, {
                method: 'DELETE',
                body: new URLSearchParams(formData),
                credentials: 'include'
            });
            
            return await response.json();
        } catch (erro) {
            return { erro: 'Erro de conexão: ' + erro.message };
        }
    }
}
