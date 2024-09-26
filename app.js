// Configuração do GitHub
const GITHUB_TOKEN = 'seu_token_aqui';
const REPO_OWNER = 'seu_nome_de_usuario';
const REPO_NAME = 'nome_do_seu_repositorio';
const FILE_PATH = 'agendamentos.json';

// Elementos do DOM
const form = document.getElementById('agendamentoForm');
const listaAgendamentos = document.getElementById('listaAgendamentos');
const agendarButton = document.getElementById('agendarButton');
const verMesBtn = document.getElementById('verMes');
const planner = document.getElementById('planner');
const plannerBody = document.getElementById('plannerBody');
const voltarBtn = document.getElementById('voltar');

const finalidadeSelect = document.getElementById('finalidade');
const solicitanteSelect = document.getElementById('solicitante');
const nomeSolicitanteInput = document.getElementById('nomeSolicitante');

const tccFields = document.getElementById('tccFields');
const manutencaoFields = document.getElementById('manutencaoFields');

const temaTcc = document.getElementById('temaTcc');
const bancaTcc = document.getElementById('bancaTcc');
const orientadorTcc = document.getElementById('orientadorTcc');
const motivoManutencao = document.getElementById('motivoManutencao');

let editIndex = -1;

const professores = ['BRUNA MARCELE', 'DANIELLE BACARELLI', 'DIANA COSTA', 'DOUGLAS CARAGELASCO', 'JOÃO FLÁVIO', 'LÍVIA BIAZZO', 'MARIANA MIRANDA', 'MARILIA FILIPONI', 'MARTA LUPPI', 'MICHELE BARROS', 'PAULA GUIMARÃES', 'PAULO GRISKA', 'PAULO ANSELMO', 'RAFAEL NEVES'];

// Funções para interagir com o GitHub
async function getAgendamentos() {
  try {
    const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
    const content = atob(response.data.content);
    return { data: JSON.parse(content), sha: response.data.sha };
  } catch (error) {
    console.error('Erro ao obter agendamentos:', error);
    return { data: [], sha: null };
  }
}

async function saveAgendamentos(agendamentos, sha) {
  try {
    const content = btoa(JSON.stringify(agendamentos, null, 2));
    await axios.put(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
      message: 'Atualizar agendamentos',
      content: content,
      sha: sha
    }, {
      headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
    });
  } catch (error) {
    console.error('Erro ao salvar agendamentos:', error);
    throw error;
  }
}

// Função para carregar agendamentos
async function carregarAgendamentos() {
  try {
    const { data: agendamentos } = await getAgendamentos();
    atualizarListaAgendamentos(agendamentos);
  } catch (error) {
    console.error('Erro ao carregar agendamentos:', error);
  }
}

// Função para atualizar a lista de agendamentos na interface
function atualizarListaAgendamentos(agendamentos) {
  listaAgendamentos.innerHTML = '';
  agendamentos.forEach((agendamento, index) => {
    const div = document.createElement('div');
    div.classList.add('agendamento-item');
    div.innerHTML = `
      <strong>FINALIDADE:</strong> ${agendamento.finalidade}<br>
      ${agendamento.finalidade === 'TCC' ? `<strong>TEMA TCC:</strong> ${agendamento.tema}<br><strong>INTEGRANTES DA BANCA:</strong> ${agendamento.banca}<br><strong>ORIENTADOR:</strong> ${agendamento.orientador}<br>` : ''}
      ${agendamento.finalidade === 'MANUTENÇÃO' ? `<strong>MOTIVO:</strong> ${agendamento.motivo}<br>` : ''}
      <strong>SOLICITANTE:</strong> ${agendamento.solicitante} - ${agendamento.nomeSolicitante}<br>
      <strong>SALA:</strong> ${agendamento.sala}<br>
      <strong>DATA:</strong> ${formatarData(agendamento.data)}<br>
      <strong>HORA:</strong> ${agendamento.hora}
    `;

    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.textContent = 'ALTERAR';
    editButton.addEventListener('click', () => carregarAgendamentoParaEdicao(index));

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.textContent = 'EXCLUIR';
    deleteButton.addEventListener('click', () => excluirAgendamento(index, agendamento.nomeSolicitante));

    div.appendChild(editButton);
    div.appendChild(deleteButton);
    listaAgendamentos.appendChild(div);
  });
}

// Função para formatar a data
function formatarData(dataISO) {
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Event Listeners
form.addEventListener('submit', async function(event) {
  event.preventDefault();

  const finalidade = document.getElementById('finalidade').value;
  const solicitante = document.getElementById('solicitante').value;
  let nomeSolicitante = document.getElementById('nomeSolicitante').value;
  const sala = document.getElementById('sala').value;
  const data = document.getElementById('data').value;
  const hora = document.getElementById('hora').value;

  let tema = '';
  let banca = '';
  let orientador = '';
  let motivo = '';

  if (finalidade === 'TCC') {
    tema = temaTcc.value;
    banca = bancaTcc.value;
    orientador = orientadorTcc.value;
  } else if (finalidade === 'MANUTENÇÃO') {
    motivo = motivoManutencao.value;
  }

  const novoAgendamento = { finalidade, solicitante, nomeSolicitante, sala, data, hora, tema, banca, orientador, motivo };

  try {
    const { data: agendamentos, sha } = await getAgendamentos();
    if (editIndex >= 0) {
      agendamentos[editIndex] = novoAgendamento;
      editIndex = -1;
      agendarButton.textContent = 'AGENDAR';
    } else {
      agendamentos.push(novoAgendamento);
    }
    await saveAgendamentos(agendamentos, sha);
    alert('AGENDAMENTO REALIZADO COM SUCESSO!');
    form.reset();
    tccFields.classList.add('hidden');
    manutencaoFields.classList.add('hidden');
    carregarAgendamentos();
  } catch (error) {
    console.error('Erro ao salvar agendamento:', error);
    alert('Erro ao salvar agendamento. Por favor, tente novamente.');
  }
});

async function excluirAgendamento(index, nomeSolicitante) {
  const nomeUsuarioAtual = prompt('PARA EXCLUIR, DIGITE O SEU NOME:');

  if (nomeUsuarioAtual === nomeSolicitante) {
    try {
      const { data: agendamentos, sha } = await getAgendamentos();
      agendamentos.splice(index, 1);
      await saveAgendamentos(agendamentos, sha);
      alert('AGENDAMENTO EXCLUÍDO COM SUCESSO!');
      carregarAgendamentos();
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      alert('Erro ao excluir agendamento. Por favor, tente novamente.');
    }
  } else {
    alert('VOCÊ SÓ PODE EXCLUIR SEUS PRÓPRIOS AGENDAMENTOS.');
  }
}

function carregarAgendamentoParaEdicao(index) {
  // Implementar lógica de edição aqui
}

// Inicialização
carregarAgendamentos();
