firebase.initializeApp({
  apiKey: "AIzaSyAgpXloiKBrnRHMBTz8UM1PA3Q9oSYiqU4",
  databaseURL: "https://garagem-hl-default-rtdb.firebaseio.com"
});
const db = firebase.database();

const servicosPadrao = {
  "Lavação de Motor": { preco: 50, desc: "Limpeza detalhada do compartimento do motor", icone: "🔧" },
  "Lavação Completa": { preco: 80, desc: "Lavagem externa e interna do veículo", icone: "🚿" },
  "Lavação Detalhada": { preco: 120, desc: "Limpeza minuciosa com acabamento premium", icone: "✨" },
  "Descontaminação de Pintura": { preco: 150, desc: "Remove impurezas da pintura", icone: "🧪" },
  "Polimento Técnico": { preco: 250, desc: "Correção profissional da pintura", icone: "💎" },
  "Polimento de Faróis": { preco: 80, desc: "Restauração da transparência dos faróis", icone: "💡" },
  "Aplicação de Cera": { preco: 60, desc: "Proteção e brilho para a pintura", icone: "🛡️" },
  "Aplicação de Selante": { preco: 90, desc: "Proteção duradoura para a pintura", icone: "🔒" },
  "Vitrificação": { preco: 350, desc: "Proteção cerâmica de alto desempenho", icone: "🏆" },
  "Revitalização de Plásticos": { preco: 70, desc: "Restaura o aspecto original", icone: "♻️" },
  "Cristalização de Para-brisa": { preco: 80, desc: "Melhora visibilidade e repelência", icone: "🪟" },
  "Remoção de Chuva Ácida": { preco: 90, desc: "Remove manchas dos vidros", icone: "🌧️" },
  "Higienização Bancos de Couro": { preco: 150, desc: "Limpeza profunda do couro", icone: "🪑" },
  "Higienização Automotiva": { preco: 180, desc: "Limpeza interna completa", icone: "🧹" },
  "Higienização Residencial": { preco: 200, desc: "Limpeza de estofados residenciais", icone: "🏠" }
};

let servicos = {};
let cart = [];
let total = 0;

function carregarServicos() {
  db.ref("servicos").on("value", snapshot => {
    const data = snapshot.val();
    if (data) {
      servicos = data;
    } else {
      servicos = { ...servicosPadrao };
      db.ref("servicos").set(servicos);
    }
    montarServicos();
    const panel = document.getElementById("gerenciarServicosPanel");
    if (panel && panel.style.display !== "none") {
      renderListaServicosGerenciar();
    }
  });
}

function showToast(message, type = "") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function montarServicos() {
  const lista = document.getElementById("listaServicos");
  lista.innerHTML = "";

  if (Object.keys(servicos).length === 0) {
    lista.innerHTML = `<div class="empty-state"><span>📋</span>Nenhum serviço cadastrado</div>`;
    return;
  }

  Object.keys(servicos).forEach(nome => {
    const s = servicos[nome];
    const btn = document.createElement("button");
    btn.className = "service-btn";
    btn.innerHTML = `
      <div class="service-info">
        <div class="service-name">${s.icone || "🔹"} ${nome}</div>
        <div class="service-desc">${s.desc}</div>
      </div>
      <span class="service-price">R$ ${s.preco}</span>`;
    btn.onclick = () => adicionarAoCarrinho(nome);
    lista.appendChild(btn);
  });
}

function adicionarAoCarrinho(nome) {
  cart.push({ nome, ...servicos[nome] });
  total += servicos[nome].preco;
  renderCart();
  showToast(`${servicos[nome].icone || "🔹"} ${nome} adicionado!`, "success");
}

function renderCart() {
  const cartEl = document.getElementById("cart");
  const itemsEl = document.getElementById("cartItems");
  const totalEl = document.getElementById("totalValue");
  const badgeEl = document.getElementById("cartBadge");

  if (cart.length === 0) {
    cartEl.classList.remove("visible");
    return;
  }

  let html = "";
  cart.forEach((item, index) => {
    html += `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.icone || "🔹"} ${item.nome}</div>
          <div class="cart-item-price">R$ ${item.preco}</div>
        </div>
        <button class="cart-remove" onclick="removerDoCarrinho(${index})">✕</button>
      </div>`;
  });

  itemsEl.innerHTML = html;
  totalEl.textContent = `R$ ${total}`;
  badgeEl.textContent = cart.length;
  cartEl.classList.add("visible");
}

function removerDoCarrinho(index) {
  const removed = cart[index];
  total -= removed.preco;
  cart.splice(index, 1);
  renderCart();
  showToast(`${removed.nome} removido`, "");
}

function mostrarSecao(id) {
  const sections = ["home", "servicos", "agendamento", "admin", "avaliacoes"];
  sections.forEach(secao => {
    document.getElementById(secao).style.display = "none";
  });
  document.getElementById(id).style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });

  const whatsBtn = document.getElementById("whatsappBtn");
  if (whatsBtn) {
    if (id === "admin") {
      whatsBtn.classList.add("hidden");
    } else {
      whatsBtn.classList.remove("hidden");
    }
  }
}

function abrirServicos() { mostrarSecao("servicos"); }
function voltarHome() { mostrarSecao("home"); }
function voltarServicos() { mostrarSecao("servicos"); }
function abrirAvaliacoes() { mostrarSecao("avaliacoes"); carregarAvaliacoes(); initStarInput(); }

function irParaAgendamento() {
  if (cart.length === 0) {
    showToast("Adicione ao menos um serviço primeiro", "error");
    return;
  }
  mostrarSecao("agendamento");
  carregarAgendaCliente();
}

document.addEventListener("DOMContentLoaded", () => {
  carregarServicos();

  document.getElementById("buscaAdmin").addEventListener("input", function () {
    if (this.value.toLowerCase() === "admin") {
      this.value = "";
      const senha = prompt("Senha:");
      if (senha === "1234") {
        mostrarSecao("admin");
      } else if (senha !== null) {
        showToast("Senha incorreta", "error");
      }
    }
  });
});

let servicoSelecionado = null;
let dataSelecionada = null;
let horariosAdmin = [];
const todasHoras = [...Array(17)].map((_, i) => String(i + 6).padStart(2, "0") + ":00");

function abrirServicoHorario() {
  const panel = document.getElementById("servicoHorario");
  const isOpen = panel.style.display !== "none" && panel.style.display !== "";
  document.getElementById("gerenciarServicosPanel").style.display = "none";
  if (isOpen) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  const lista = document.getElementById("listaServicosAdmin");
  lista.innerHTML = "";
  Object.keys(servicos).forEach(nome => {
    const s = servicos[nome];
    lista.innerHTML += `<button class="main-btn" onclick="abrirConfigAdmin('${nome.replace(/'/g, "\\'")}')">${s.icone || "🔹"} ${nome}</button>`;
  });
}

function abrirConfigAdmin(nome) {
  servicoSelecionado = nome;
  dataSelecionada = null;
  horariosAdmin = [];
  const lista = document.getElementById("listaServicosAdmin");
  lista.innerHTML = `
    <h3 style="color:#38bdf8;margin-bottom:14px">${(servicos[nome] && servicos[nome].icone) || "🔹"} ${nome}</h3>

    <div class="date-box">
      <label>📅 ESCOLHA A DATA</label>
      <input type="date" id="dataAdm">
    </div>

    <div id="resumo" class="selected-box" style="display:none"></div>

    <div class="clock-grid" id="relogio"></div>

    <button class="main-btn secondary" onclick="limparTudo()">🔄 Trocar data / Limpar</button>
    <button class="main-btn" onclick="salvarHorarios()">💾 Salvar</button>
    <button class="main-btn secondary" onclick="abrirServicoHorario()">← Voltar</button>
  `;

  document.getElementById("dataAdm").onchange = e => {
    dataSelecionada = e.target.value;
    horariosAdmin = [];
    carregarHorariosExistentes();
  };

  montarRelogioAdmin();
}

function carregarHorariosExistentes() {
  if (!dataSelecionada || !servicoSelecionado) return;
  db.ref(`agenda/${dataSelecionada}/${servicoSelecionado}`).once("value", snapshot => {
    const data = snapshot.val();
    if (data) horariosAdmin = Object.keys(data);
    montarRelogioAdmin();
    atualizarResumoAdmin();
  });
}

function montarRelogioAdmin() {
  const relogio = document.getElementById("relogio");
  relogio.innerHTML = "";
  todasHoras.forEach(hora => {
    const div = document.createElement("div");
    div.className = "clock-hour";
    div.textContent = hora;
    if (horariosAdmin.includes(hora)) div.classList.add("active");
    div.onclick = () => {
      if (horariosAdmin.includes(hora)) {
        horariosAdmin = horariosAdmin.filter(h => h !== hora);
        div.classList.remove("active");
      } else {
        horariosAdmin.push(hora);
        div.classList.add("active");
      }
      atualizarResumoAdmin();
    };
    relogio.appendChild(div);
  });
}

function atualizarResumoAdmin() {
  if (!dataSelecionada) return;
  const resumo = document.getElementById("resumo");
  resumo.style.display = "block";
  const dataFormatada = dataSelecionada.split("-").reverse().join("/");
  const horasOrdenadas = [...horariosAdmin].sort();
  if (horasOrdenadas.length === 0) {
    resumo.innerHTML = `<strong>Data:</strong> ${dataFormatada}<br><span style="color:#475569">Nenhum horário selecionado</span>`;
    return;
  }
  resumo.innerHTML = `
    <strong>Data:</strong> ${dataFormatada}<br>
    <strong>Horários (${horasOrdenadas.length}):</strong><br>
    ${horasOrdenadas.map(h => `• ${h} <span class="remove-mini" onclick="removerHorarioAdmin('${h}')">remover</span>`).join("<br>")}
  `;
}

function removerHorarioAdmin(hora) {
  horariosAdmin = horariosAdmin.filter(h => h !== hora);
  atualizarResumoAdmin();
  montarRelogioAdmin();
}

function limparTudo() {
  dataSelecionada = null;
  horariosAdmin = [];
  const resumo = document.getElementById("resumo");
  if (resumo) resumo.style.display = "none";
  const dataAdm = document.getElementById("dataAdm");
  if (dataAdm) dataAdm.value = "";
  montarRelogioAdmin();
}

function salvarHorarios() {
  if (!dataSelecionada || horariosAdmin.length === 0) {
    showToast("Selecione uma data e pelo menos um horário", "error");
    return;
  }
  const ref = db.ref(`agenda/${dataSelecionada}/${servicoSelecionado}`);
  ref.remove().then(() => {
    const updates = {};
    horariosAdmin.forEach(hora => { updates[hora] = { vagas: 1 }; });
    return ref.update(updates);
  }).then(() => {
    showToast("Horários salvos com sucesso!", "success");
    abrirServicoHorario();
  }).catch(() => {
    showToast("Erro ao salvar. Tente novamente.", "error");
  });
}

function resetarAgenda() {
  if (confirm("Tem certeza que deseja apagar toda a agenda?")) {
    db.ref("agenda").remove().then(() => {
      showToast("Agenda resetada", "success");
    }).catch(() => {
      showToast("Erro ao resetar agenda", "error");
    });
  }
}

function abrirGerenciarServicos() {
  const panel = document.getElementById("gerenciarServicosPanel");
  const isOpen = panel.style.display !== "none" && panel.style.display !== "";
  document.getElementById("servicoHorario").style.display = "none";
  if (isOpen) {
    panel.style.display = "none";
    return;
  }
  panel.style.display = "block";
  renderListaServicosGerenciar();
}

function fecharGerenciarServicos() {
  document.getElementById("gerenciarServicosPanel").style.display = "none";
}

function renderListaServicosGerenciar() {
  const container = document.getElementById("listaServicosGerenciar");
  container.innerHTML = "";

  const nomes = Object.keys(servicos);
  if (nomes.length === 0) {
    container.innerHTML = `<div class="empty-state"><span>📋</span>Nenhum serviço cadastrado</div>`;
    return;
  }

  nomes.forEach(nome => {
    const s = servicos[nome];
    const card = document.createElement("div");
    card.className = "admin-service-card";
    card.innerHTML = `
      <div class="admin-service-header">
        <div class="admin-service-name">${s.icone || "🔹"} ${nome}</div>
        <div class="admin-service-price">R$ ${s.preco}</div>
      </div>
      <div class="admin-service-desc">${s.desc}</div>
      <div class="admin-service-actions">
        <button class="admin-action-btn edit" onclick="abrirEditarServico('${nome.replace(/'/g, "\\'")}')">✏️ Editar</button>
        <button class="admin-action-btn delete" onclick="removerServico('${nome.replace(/'/g, "\\'")}')">🗑️ Remover</button>
      </div>
    `;
    container.appendChild(card);
  });
}

function abrirFormNovoServico() {
  document.getElementById("formServico").style.display = "block";
  document.getElementById("formServicoTitulo").textContent = "Novo Serviço";
  document.getElementById("servicoNomeOriginal").value = "";
  document.getElementById("servicoNome").value = "";
  document.getElementById("servicoPreco").value = "";
  document.getElementById("servicoDesc").value = "";
  document.getElementById("servicoIcone").value = "";
  document.getElementById("servicoNome").disabled = false;
}

function abrirEditarServico(nome) {
  const s = servicos[nome];
  if (!s) return;

  document.getElementById("formServico").style.display = "block";
  document.getElementById("formServicoTitulo").textContent = "Editar Serviço";
  document.getElementById("servicoNomeOriginal").value = nome;
  document.getElementById("servicoNome").value = nome;
  document.getElementById("servicoPreco").value = s.preco;
  document.getElementById("servicoDesc").value = s.desc;
  document.getElementById("servicoIcone").value = s.icone || "";
  document.getElementById("servicoNome").disabled = false;
}

function fecharFormServico() {
  document.getElementById("formServico").style.display = "none";
}

function salvarServico() {
  const nomeOriginal = document.getElementById("servicoNomeOriginal").value.trim();
  const nome = document.getElementById("servicoNome").value.trim();
  const preco = parseInt(document.getElementById("servicoPreco").value);
  const desc = document.getElementById("servicoDesc").value.trim();
  const icone = document.getElementById("servicoIcone").value.trim() || "🔹";

  if (!nome) {
    showToast("Preencha o nome do serviço", "error");
    return;
  }
  if (isNaN(preco) || preco <= 0) {
    showToast("Preencha um preço válido", "error");
    return;
  }
  if (!desc) {
    showToast("Preencha a descrição", "error");
    return;
  }

  if (nomeOriginal && nomeOriginal !== nome && servicos[nome]) {
    showToast("Já existe um serviço com esse nome", "error");
    return;
  }
  if (!nomeOriginal && servicos[nome]) {
    showToast("Já existe um serviço com esse nome", "error");
    return;
  }

  const servicoData = { preco, desc, icone };
  const updates = {};
  updates[`servicos/${nome}`] = servicoData;
  if (nomeOriginal && nomeOriginal !== nome) {
    updates[`servicos/${nomeOriginal}`] = null;
  }

  db.ref().update(updates).then(() => {
    fecharFormServico();
    showToast(nomeOriginal ? "Serviço atualizado!" : "Serviço adicionado!", "success");
  }).catch(() => {
    showToast("Erro ao salvar serviço", "error");
  });
}

function removerServico(nome) {
  if (!confirm(`Remover o serviço "${nome}"?`)) return;

  db.ref(`servicos/${nome}`).remove().then(() => {
    showToast(`"${nome}" removido`, "success");
  }).catch(() => {
    showToast("Erro ao remover serviço", "error");
  });
}

let agendaDataCliente = null;
let agendaHoraCliente = null;

function carregarAgendaCliente() {
  agendaDataCliente = null;
  agendaHoraCliente = null;

  const calendario = document.getElementById("calendario");
  calendario.innerHTML = `
    <div class="card">
      <p style="color:#94a3b8;font-size:14px;margin-bottom:14px">
        Selecione a data e o horário disponível:
      </p>
      <div id="agendaDatas">
        <div class="empty-state"><span>📅</span>Carregando datas disponíveis...</div>
      </div>
    </div>
    <div id="agendaHorasContainer" style="display:none">
      <div class="card">
        <h3 style="color:#38bdf8;font-size:16px;margin-bottom:12px">Horários disponíveis</h3>
        <div id="agendaHoras" class="agenda-hours-grid"></div>
      </div>
    </div>
    <div id="agendaForm" style="display:none">
      <div class="card">
        <h3 style="color:#38bdf8;font-size:16px;margin-bottom:6px">Seus dados</h3>
        <div class="client-form">
          <label>Nome</label>
          <input type="text" id="clienteNome" placeholder="Seu nome completo">
          <label>Telefone</label>
          <input type="tel" id="clienteTel" placeholder="(00) 00000-0000">
        </div>
        <button class="main-btn" style="margin-top:18px" onclick="confirmarAgendamento()">✅ Confirmar Agendamento</button>
      </div>
    </div>
  `;

  db.ref("agenda").once("value", snapshot => {
    const data = snapshot.val();
    const datasEl = document.getElementById("agendaDatas");

    if (!data) {
      datasEl.innerHTML = `<div class="empty-state"><span>😕</span>Nenhuma data disponível no momento.<br>Entre em contato para mais informações.</div>`;
      return;
    }

    const hoje = new Date().toISOString().split("T")[0];
    const datasDisponiveis = Object.keys(data).filter(d => d >= hoje).sort();

    if (datasDisponiveis.length === 0) {
      datasEl.innerHTML = `<div class="empty-state"><span>😕</span>Nenhuma data futura disponível no momento.</div>`;
      return;
    }

    datasEl.innerHTML = "";
    datasDisponiveis.forEach(dateStr => {
      const [ano, mes, dia] = dateStr.split("-");
      const dateObj = new Date(dateStr + "T12:00:00");
      const diaSemana = dateObj.toLocaleDateString("pt-BR", { weekday: "long" });
      const servicosDisponiveis = Object.keys(data[dateStr]);
      const servicosNoCarrinho = cart.map(c => c.nome);
      const temServico = servicosDisponiveis.some(s => servicosNoCarrinho.includes(s));
      if (!temServico) return;

      const card = document.createElement("div");
      card.className = "agenda-date-card";
      card.innerHTML = `
        <div class="agenda-date-label">📅 ${dia}/${mes}/${ano}</div>
        <div style="color:#94a3b8;font-size:13px;text-transform:capitalize">${diaSemana}</div>
      `;
      card.onclick = () => selecionarDataCliente(dateStr, data[dateStr], card);
      datasEl.appendChild(card);
    });

    if (datasEl.children.length === 0) {
      datasEl.innerHTML = `<div class="empty-state"><span>😕</span>Nenhuma data disponível para os serviços selecionados.</div>`;
    }
  });
}

function selecionarDataCliente(dateStr, agendaDoDia, cardEl) {
  agendaDataCliente = dateStr;
  agendaHoraCliente = null;
  document.querySelectorAll(".agenda-date-card").forEach(c => c.classList.remove("selected"));
  cardEl.classList.add("selected");

  const servicosNoCarrinho = cart.map(c => c.nome);
  const horasDisponiveis = new Set();

  const horasPorServico = [];
  servicosNoCarrinho.forEach(nomeServico => {
    const horasServico = new Set();
    if (agendaDoDia[nomeServico]) {
      Object.keys(agendaDoDia[nomeServico]).forEach(hora => {
        if (agendaDoDia[nomeServico][hora].vagas > 0) horasServico.add(hora);
      });
    }
    horasPorServico.push(horasServico);
  });

  if (horasPorServico.length > 0) {
    horasPorServico[0].forEach(hora => {
      if (horasPorServico.every(set => set.has(hora))) horasDisponiveis.add(hora);
    });
  }

  const container = document.getElementById("agendaHorasContainer");
  const horasEl = document.getElementById("agendaHoras");

  if (horasDisponiveis.size === 0) {
    container.style.display = "block";
    horasEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span>⏰</span>Sem horários disponíveis nesta data</div>`;
    document.getElementById("agendaForm").style.display = "none";
    return;
  }

  container.style.display = "block";
  horasEl.innerHTML = "";
  [...horasDisponiveis].sort().forEach(hora => {
    const btn = document.createElement("button");
    btn.className = "agenda-hour-btn";
    btn.textContent = hora;
    btn.onclick = function() { selecionarHoraCliente(hora, this); };
    horasEl.appendChild(btn);
  });
}

function selecionarHoraCliente(hora, btnEl) {
  agendaHoraCliente = hora;
  document.querySelectorAll(".agenda-hour-btn").forEach(b => b.classList.remove("selected-hour"));
  btnEl.classList.add("selected-hour");
  document.getElementById("agendaForm").style.display = "block";
}

function confirmarAgendamento() {
  const nome = document.getElementById("clienteNome").value.trim();
  const tel = document.getElementById("clienteTel").value.trim();

  if (!nome) { showToast("Preencha seu nome", "error"); return; }
  if (!tel) { showToast("Preencha seu telefone", "error"); return; }
  if (!agendaDataCliente || !agendaHoraCliente) { showToast("Selecione uma data e horário", "error"); return; }

  const servicosNoCarrinho = cart.map(c => c.nome);
  const agendamentoData = {
    cliente: nome,
    telefone: tel,
    servicos: servicosNoCarrinho,
    total: total,
    dataHora: `${agendaDataCliente} ${agendaHoraCliente}`
  };

  const transactionPromises = servicosNoCarrinho.map(nomeServico => {
    return db.ref(`agenda/${agendaDataCliente}/${nomeServico}/${agendaHoraCliente}/vagas`)
      .transaction(vagas => {
        if (vagas > 0) return vagas - 1;
        return vagas;
      });
  });

  Promise.all(transactionPromises).then(results => {
    const allCommitted = results.every(r => r.committed);
    if (!allCommitted) {
      showToast("Horário indisponível. Tente outro.", "error");
      carregarAgendaCliente();
      return;
    }
    const agendamentoRef = db.ref("agendamentos").push();
    return agendamentoRef.set(agendamentoData);
  }).then(result => {
    if (result === undefined) return;
    cart = [];
    total = 0;
    renderCart();
    showToast("Agendamento confirmado! Entraremos em contato.", "success");

    const [ano, mes, dia] = agendaDataCliente.split("-");
    document.getElementById("calendario").innerHTML = `
      <div class="card" style="text-align:center;padding:30px">
        <div style="font-size:48px;margin-bottom:14px">✅</div>
        <h3 style="color:#22c55e;margin-bottom:10px">Agendamento Confirmado!</h3>
        <p style="color:#94a3b8;font-size:14px;line-height:1.8">
          <strong style="color:#fff">${nome}</strong><br>
          📅 ${dia}/${mes}/${ano} às ${agendaHoraCliente}<br>
          📞 ${tel}<br>
          💰 Total: R$ ${agendamentoData.total}
        </p>
        <div class="divider"></div>
        <p style="color:#475569;font-size:13px">Entraremos em contato para confirmar</p>
        <button class="main-btn" style="margin-top:18px" onclick="voltarHome()">🏠 Voltar ao Início</button>
      </div>
    `;
  }).catch(() => {
    showToast("Erro ao agendar. Tente novamente.", "error");
  });
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

let reviewStars = 0;

function initStarInput() {
  reviewStars = 0;
  const stars = document.querySelectorAll("#starInput .star-input");
  stars.forEach(star => {
    star.classList.remove("active", "hover");
    star.onmouseenter = () => {
      const val = parseInt(star.dataset.value);
      stars.forEach(s => {
        s.classList.toggle("hover", parseInt(s.dataset.value) <= val);
      });
    };
    star.onmouseleave = () => {
      stars.forEach(s => s.classList.remove("hover"));
    };
    star.onclick = () => {
      reviewStars = parseInt(star.dataset.value);
      stars.forEach(s => {
        s.classList.toggle("active", parseInt(s.dataset.value) <= reviewStars);
      });
    };
  });
}

function gerarEstrelas(nota) {
  let s = "";
  for (let i = 1; i <= 5; i++) {
    s += i <= nota ? "★" : "☆";
  }
  return s;
}

function carregarAvaliacoes() {
  db.ref("avaliacoes").orderByChild("timestamp").once("value", snapshot => {
    const data = snapshot.val();
    const summaryEl = document.getElementById("reviewsSummary");
    const listaEl = document.getElementById("listaAvaliacoes");

    if (!data) {
      summaryEl.innerHTML = `
        <div class="reviews-avg">-</div>
        <div class="reviews-stars-display" style="color:rgba(71,85,105,0.4)">☆☆☆☆☆</div>
        <div class="reviews-count">Nenhuma avaliação ainda</div>
      `;
      listaEl.innerHTML = `<div class="empty-state"><span>⭐</span>Seja o primeiro a avaliar!</div>`;
      return;
    }

    const reviews = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    const totalNotas = reviews.reduce((sum, r) => sum + r.nota, 0);
    const media = (totalNotas / reviews.length).toFixed(1);
    const mediaArredondada = Math.round(totalNotas / reviews.length);

    summaryEl.innerHTML = `
      <div class="reviews-avg">${media}</div>
      <div class="reviews-stars-display">${gerarEstrelas(mediaArredondada)}</div>
      <div class="reviews-count">${reviews.length} avaliação${reviews.length !== 1 ? "ões" : ""}</div>
    `;

    listaEl.innerHTML = "";
    reviews.forEach(r => {
      const dateStr = r.data || "";
      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-header">
          <div class="review-author">${escapeHTML(r.nome)}</div>
          <div class="review-date">${escapeHTML(dateStr)}</div>
        </div>
        <div class="review-stars">${gerarEstrelas(r.nota)}</div>
        <div class="review-text">${escapeHTML(r.comentario)}</div>
      `;
      listaEl.appendChild(card);
    });
  });
}

function enviarAvaliacao() {
  const nome = document.getElementById("reviewNome").value.trim();
  const comentario = document.getElementById("reviewComentario").value.trim();

  if (!nome) { showToast("Preencha seu nome", "error"); return; }
  if (reviewStars === 0) { showToast("Selecione uma nota de 1 a 5 estrelas", "error"); return; }
  if (!comentario) { showToast("Escreva um comentário", "error"); return; }

  const hoje = new Date();
  const dataFormatada = hoje.toLocaleDateString("pt-BR");

  const avaliacao = {
    nome,
    nota: reviewStars,
    comentario,
    data: dataFormatada,
    timestamp: Date.now()
  };

  db.ref("avaliacoes").push(avaliacao).then(() => {
    showToast("Avaliação enviada! Obrigado!", "success");
    document.getElementById("reviewNome").value = "";
    document.getElementById("reviewComentario").value = "";
    reviewStars = 0;
    initStarInput();
    carregarAvaliacoes();
  }).catch(() => {
    showToast("Erro ao enviar avaliação", "error");
  });
}
