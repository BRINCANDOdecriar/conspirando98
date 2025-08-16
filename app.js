// Configuração do Firebase - SUBSTITUA COM SUAS CREDENCIAIS
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Elementos DOM
const loginArea = document.getElementById('login-area');
const postCreator = document.getElementById('post-creator');
const loginError = document.getElementById('login-error');
const postsContainer = document.getElementById('posts-container');
const postMessage = document.getElementById('post-message');

// Estado global
let posts = [];

// Função de Login
async function loginOwner() {
  const email = document.getElementById('owner-email').value;
  const password = document.getElementById('owner-password').value;
  
  // Validação básica
  if (!email || !password) {
    loginError.textContent = "Por favor, preencha todos os campos.";
    return;
  }
  
  try {
    loginError.textContent = "Entrando...";
    await auth.signInWithEmailAndPassword(email, password);
    
    // Esconde mensagem de erro se o login for bem-sucedido
    loginError.textContent = "";
    
    // Mostra feedback visual
    loginError.style.color = "#00ffaa";
    loginError.textContent = "Login bem-sucedido!";
    
    // Atualiza a UI
    loginArea.style.display = 'none';
    postCreator.style.display = 'block';
    
  } catch (error) {
    console.error("Erro de login:", error);
    loginError.textContent = "Credenciais inválidas. Tente novamente.";
  }
}

// Função para criar posts
async function createPost() {
  if (!auth.currentUser) {
    postMessage.textContent = "Faça login primeiro!";
    return;
  }

  const title = document.getElementById('new-post-title').value;
  const content = document.getElementById('new-post-content').value;
  
  if (!title || !content) {
    postMessage.textContent = "Preencha o título e o conteúdo!";
    return;
  }

  try {
    postMessage.textContent = "Publicando...";
    
    await db.collection("posts").add({
      title,
      content,
      likes: 0,
      dislikes: 0,
      comments: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      owner: auth.currentUser.uid
    });
    
    // Feedback e limpeza
    postMessage.textContent = "Teoria publicada com sucesso!";
    document.getElementById('new-post-title').value = '';
    document.getElementById('new-post-content').value = '';
    
    // Limpa a mensagem após 3 segundos
    setTimeout(() => {
      postMessage.textContent = '';
    }, 3000);
    
  } catch (error) {
    console.error("Erro ao criar post:", error);
    postMessage.textContent = "Erro ao publicar. Tente novamente.";
  }
}

// Carregar posts do Firestore
function loadPosts() {
  db.collection("posts")
    .orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
      posts = [];
      postsContainer.innerHTML = '';
      
      snapshot.forEach(doc => {
        const post = { id: doc.id, ...doc.data() };
        posts.push(post);
        renderPost(post);
      });
    });
}

// Renderizar cada post
function renderPost(post) {
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.innerHTML = `
    <h3>${post.title}</h3>
    <div class="post-content">${post.content}</div>
    <div class="feedback">
      <button onclick="likePost('${post.id}')">👍 Curtir (${post.likes || 0})</button>
      <button onclick="dislikePost('${post.id}')">👎 Descurtir (${post.dislikes || 0})</button>
      <input type="text" id="comment-${post.id}" placeholder="Comentário (máx. 120 caracteres)" maxlength="120">
      <button onclick="addComment('${post.id}')">💬 Comentar</button>
    </div>
    <div class="comments">
      ${(post.comments || []).map(comment => `
        <div class="comment">💬 ${comment}</div>
      `).join('')}
    </div>
  `;
  postsContainer.appendChild(postElement);
}

// Funções de interação
async function likePost(postId) {
  try {
    await db.collection("posts").doc(postId).update({
      likes: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error("Erro ao curtir:", error);
  }
}

async function dislikePost(postId) {
  try {
    await db.collection("posts").doc(postId).update({
      dislikes: firebase.firestore.FieldValue.increment(1)
    });
  } catch (error) {
    console.error("Erro ao descurtir:", error);
  }
}

async function addComment(postId) {
  const commentInput = document.getElementById(`comment-${postId}`);
  const comment = commentInput.value.trim();
  
  if (!comment) return;
  
  try {
    await db.collection("posts").doc(postId).update({
      comments: firebase.firestore.FieldValue.arrayUnion(comment)
    });
    commentInput.value = '';
  } catch (error) {
    console.error("Erro ao comentar:", error);
  }
}

// Verificar estado de autenticação ao carregar
auth.onAuthStateChanged(user => {
  if (user) {
    // Usuário está logado (você)
    loginArea.style.display = 'none';
    postCreator.style.display = 'block';
  } else {
    // Usuário não logado (visitante)
    loginArea.style.display = 'block';
    postCreator.style.display = 'none';
  }
});

// Inicializar o app
loadPosts();
