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
async function carregarEstilos() {
  try {
    const resposta = await fetchAutenticado(`${API}/estilos`);

    console.log('Status HTTP:', resposta.status);

    const estilos = await resposta.json();

    console.log('Estilos recebidos:', estilos);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    if (!Array.isArray(estilos)) {
      throw new Error('A API não retornou uma lista de estilos.');
    }

    const lista = document.getElementById('lista-estilos');

    if (!lista) {
      throw new Error('Elemento lista-estilos não encontrado no HTML.');
    }

    lista.innerHTML = '';

    
    estilos.forEach(estilo => {
      console.log('Objeto de estilo:', estilo);

      const id = estilo.idestilo;
      const nome = estilo.descricao;

      if (id === undefined || nome === undefined) {
        console.error('Propriedades incorretas:', estilo);
        return;
      }

      lista.innerHTML += `
        <div class="form-check">
          <input
            class="form-check-input"
            type="checkbox"
            name="estilos"
            id="estilo-${id}"
            value="${id}"
          >
          <label
            class="form-check-label"
            for="estilo-${id}"
          >
            ${nome}
          </label>
        </div>
      `;
    });

    return true;

  } catch (erro) {
    console.error('Erro ao carregar estilos:', erro);
    return false;
  }
}


carregarEstilos();
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
      <td>
        <button
          type="button"
          class="btn btn-warning btn-sm me-1"
          onclick="editarTatuador(${t.idtatuador})">
          Editar
        </button>

        <button
          type="button"
          class="btn btn-danger btn-sm"
          onclick="deletarTatuador(${t.idtatuador})">
          Excluir
        </button>
      </td>
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

const estilosSelecionados = Array.from(
  document.querySelectorAll('input[name="estilos"]:checked')
).map(checkbox => Number(checkbox.value));

const tatuador = {
  nometatuador: document.getElementById('nometatuador').value,
  cpf: document.getElementById('cpf').value,
  email: document.getElementById('email').value || null,
  telefone: document.getElementById('telefone').value || null,
  datacontratacao: new Date().toISOString().split('T')[0],
  idsenioridade: Number(document.getElementById('idsenioridade').value),
  estilos: estilosSelecionados
};
console.log('Estilos selecionados:', estilosSelecionados);
console.log('Dados enviados:', tatuador);

  const idTatuador = formTatuador.dataset.idTatuador
try {
  let resposta;
  let resultado;

  if (idTatuador) {
    // 1. Atualiza os dados do tatuador
    resposta = await fetchAutenticado(
      `${API}/tatuadores/${idTatuador}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tatuador)
      }
    );

    if (!resposta.ok) {
      throw new Error(`Erro ao atualizar tatuador: HTTP ${resposta.status}`);
    }

    // 2. Atualiza os estilos selecionados
    resposta = await fetchAutenticado(
      `${API}/tatuadores/${idTatuador}/estilos`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idestilos: estilosSelecionados
        })
      }
    );

    resultado = await resposta.json();

    if (!resposta.ok) {
      throw new Error(
        `Erro ao atualizar estilos: ${JSON.stringify(resultado)}`
      );
    }

 

} else {
  // 3. Cadastra o tatuador
  resposta = await fetchAutenticado(`${API}/tatuadores`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tatuador: {
        nometatuador: tatuador.nometatuador,
        cpf: tatuador.cpf,
        email: tatuador.email,
        telefone: tatuador.telefone,
        datacontratacao: tatuador.datacontratacao,
        idsenioridade: tatuador.idsenioridade
      },
      dados_estilos: {
        idestilos: estilosSelecionados
      }
    })
  });

  resultado = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      `Erro ao cadastrar tatuador: ${JSON.stringify(resultado)}`
    );
  }
}



  alert('Operação realizada com sucesso!');
  limparFormulario();
  await listarTatuadores();

} catch (erro) {
  console.error('Erro ao salvar:', erro);
  alert('Não foi possível salvar: ' + erro.message);
}
  
})
async function editarTatuador(id) {
  try {
    // Garante que a lista de estilos esteja carregada
    await carregarEstilos();

    const resposta = await fetchAutenticado(
      `${API}/tatuadores/${id}`
    );

    const tatuador = await resposta.json();

    if (!resposta.ok) {
      throw new Error(`Erro HTTP ${resposta.status}`);
    }

    preencherFormularioEdicao(tatuador);

    // Busca os estilos associados ao tatuador
    const respostaEstilos = await fetchAutenticado(
      `${API}/tatuadores/${id}/estilos`
    );

    if (!respostaEstilos.ok) {
      throw new Error('Não foi possível buscar os estilos do tatuador.');
    }

    const dadosEstilos = await respostaEstilos.json();

console.log('Resposta dos estilos do tatuador:', dadosEstilos);

const idsEstilos = dadosEstilos.map(estilo =>
  Number(typeof estilo === 'object' ? estilo.idestilo : estilo)
);

console.log('IDs dos estilos:', idsEstilos);

document.querySelectorAll('input[name="estilos"]').forEach(checkbox => {
  checkbox.checked = idsEstilos.includes(Number(checkbox.value));
});

  } catch (erro) {
    console.error('Erro ao editar tatuador:', erro);
    alert('Não foi possível carregar os dados do tatuador.');
  }
}

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