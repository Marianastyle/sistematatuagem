// endereço da nossa API backend
const API = 'http://127.0.0.1:8000'
protegerPagina()   // bloqueia a página se não tiver login
// elementos do formulário e do botão de enviar
const formTatuador = document.getElementById('form-tatuador')
const botaoSubmit = document.getElementById('btn-submit-tatuador')

// limpa o formulário e devolve o botão para o modo de cadastro
function limparFormulario() {
  formTatuador.reset()
  delete formTatuador.dataset.idTatuador
  botaoSubmit.textContent = 'Cadastrar'
  botaoSubmit.classList.remove('btn-success')
  botaoSubmit.classList.add('btn-primary')
}

async function fetchAutenticado(url, opcoes = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...opcoes.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return window.fetch(url, {
    ...opcoes,
    headers
  });
} 

// ─── Busca as senioridades na API e preenche o <select> ───
async function carregarSenioridades() {
  try {
    const resposta = await fetchAutenticado(`${API}/senioridade`);
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        `HTTP ${resposta.status}: ${JSON.stringify(dados)}`
      );
    }

    if (!Array.isArray(dados)) {
      throw new Error('A API não retornou uma lista.');
    }

    const select = document.getElementById('idsenioridade');
    select.innerHTML = '<option value="">Senioridade...</option>';

    dados.forEach(s => {
      select.innerHTML +=
        `<option value="${s.idsenioridade}">${s.nome}</option>`;
    });
  } catch (erro) {
    console.error('Erro ao carregar senioridades:', erro);
  }
}
carregarSenioridades()

// ─── Carrega a lista de tatuadores ao abrir a página ───
async function listarTatuadores() {
  try {
    const resposta = await fetchAutenticado(`${API}/tatuadores`);
    const tatuadores = await resposta.json();

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    if (!Array.isArray(tatuadores)) {
      throw new Error('A API não retornou uma lista de tatuadores.');
    }

    const corpo = document.getElementById('corpo-tabela');
    corpo.innerHTML = '';

    tatuadores.forEach(t => {
      corpo.innerHTML += `
        <tr>
          <td>${t.idtatuador}</td>
          <td>${t.nometatuador}</td>
          <td>${t.cpf}</td>
          <td>${t.email ?? '-'}</td>
          <td>${t.telefone ?? '-'}</td>
          <td>${t.senioridade ?? '-'}</td>
          <td>${t.estilos ?? '-'}</td>
        </tr>`;
    });

  } catch (erro) {
    console.error('Erro ao listar tatuadores:', erro);
  }
}

listarTatuadores();
// ─── Cadastrar e atualizar tatuadores ───
formTatuador.addEventListener('submit', async (e) => {
  e.preventDefault()

  const tatuador = {
    nometatuador: document.getElementById('nometatuador').value,
    cpf: document.getElementById('cpf').value,
    email: document.getElementById('email').value || null,
    telefone: document.getElementById('telefone').value || null,
    datacontratacao: new Date().toISOString().split('T')[0],
    idsenioridade: Number(document.getElementById('idsenioridade').value)
    // Number(...) converte o texto do <select> em número
    // o backend espera idsenioridade como int, não como texto
  }

  const idTatuador = formTatuador.dataset.idTatuador

  if (idTatuador) {
    await fetchAutenticado(`${API}/tatuadores/${idTatuador}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tatuador)
    })
  } else {
    await fetchAutenticado(`${API}/tatuadores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tatuador)
    })
  }

  limparFormulario()
  listarTatuadores()
})

// ─── Abre os dados do tatuador no formulário para edição ───
function preencherFormularioEdicao(tatuador) {
  document.getElementById('nometatuador').value = tatuador.nometatuador
  document.getElementById('cpf').value = tatuador.cpf
  document.getElementById('email').value = tatuador.email || ''
  document.getElementById('telefone').value = tatuador.telefone || ''
  document.getElementById('idsenioridade').value = tatuador.idsenioridade
  // o navegador encontra a <option> com esse value e a seleciona sozinho

  formTatuador.dataset.idTatuador = tatuador.idtatuador

  botaoSubmit.textContent = 'Salvar alteração'
  botaoSubmit.classList.remove('btn-primary')
  botaoSubmit.classList.add('btn-success')
}

// ─── Exclui um tatuador ───
async function deletarTatuador(id) {
  if (!confirm('Tem certeza que deseja excluir este tatuador?')) return

  await fetchAutenticado(`${API}/tatuadores/${id}`, { method: 'DELETE' })
  listarTatuadores()
}