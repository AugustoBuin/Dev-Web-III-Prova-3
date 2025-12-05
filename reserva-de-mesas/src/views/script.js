const API_BASE = "";
const mesaSelect = document.getElementById("mesaSelect");
const mesasContainer = document.getElementById("mesasContainer");
const listaReservas = document.getElementById("listaReservas");
const reservaForm = document.getElementById("reservaForm");
const limparBtn = document.getElementById("limparBtn");
const filtroCliente = document.getElementById("filtroCliente");
const filtroStatus = document.getElementById("filtroStatus");
const btnFiltrar = document.getElementById("btnFiltrar");
const reservaIdInput = document.getElementById("reservaId");

let mesas = [];
let reservas = [];

async function fetchMesas() {
    const res = await fetch(`${API_BASE}/mesas`);
    mesas = await res.json();
    renderMesas();
    preencherMesaSelect();
}

async function fetchReservas(filters = {}) {
    const qs = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/reservas${qs ? ("?" + qs) : ""}`);
    reservas = await res.json();
    renderReservas();
    renderMesas(); // atualiza cores
}

function formatDateLocal(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleString();
}

function getStatusForReserva(r) {
    return r.status || "reservado";
}

function mesaStatusColor(mesaNumero) {
    // se existir alguma reserva ocupada para a mesa num -> vermelho
    const now = new Date();
    const relevant = reservas.filter(r => r.mesa === mesaNumero && r.status !== "cancelado");
    // preferir ocupado > reservado > finalizado
    for (const r of relevant) {
        if (r.status === "ocupado") return "ocupado";
    }
    for (const r of relevant) {
        if (r.status === "reservado") return "reservado";
    }
    for (const r of relevant) {
        if (r.status === "finalizado") return "cancelado";
    }
    return "disponivel";
}

function renderMesas() {
    mesasContainer.innerHTML = "";
    mesas.forEach(m => {
        const st = mesaStatusColor(m.numero);
        const div = document.createElement("div");
        div.className = `mesa ${st}`;
        div.innerHTML = `<div class="num">Mesa ${m.numero}</div><div class="cap">${m.capacidade} lugares</div>`;
        div.onclick = () => {
            // preencher form com mesa selecionada
            mesaSelect.value = m.numero;
            window.scrollTo({ top: 0, behavior: "smooth" });
        };
        mesasContainer.appendChild(div);
    });
}

function preencherMesaSelect() {
    mesaSelect.innerHTML = "<option value=''>Selecione</option>";
    mesas.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.numero;
        opt.textContent = `Mesa ${m.numero} - ${m.capacidade} lugares (${m.localizacao})`;
        mesaSelect.appendChild(opt);
    });
}

function renderReservas() {
    listaReservas.innerHTML = "";
    reservas.forEach(r => {
        const li = document.createElement("li");
        li.innerHTML = `
      <div>
        <div><strong>${r.cliente}</strong> — Mesa ${r.mesa} — ${r.pessoas} pessoas</div>
        <div class="meta">${formatDateLocal(r.dataHora)} • ${r.status}</div>
      </div>
      <div class="acoes">
        <button onclick="editarReserva('${r._id}')">Editar</button>
        <button onclick="cancelarReserva('${r._id}')">Cancelar</button>
      </div>
    `;
        listaReservas.appendChild(li);
    });
}

window.editarReserva = async function (id) {
    const res = await fetch(`${API_BASE}/reservas`);
    const todas = await res.json();
    const r = todas.find(x => x._id === id);
    if (!r) return alert("Reserva não encontrada");
    reservaIdInput.value = r._id;
    document.getElementById("cliente").value = r.cliente;
    document.getElementById("contato").value = r.contato;
    document.getElementById("mesaSelect").value = r.mesa;
    document.getElementById("pessoas").value = r.pessoas;
    const dt = new Date(r.dataHora);
    // format to datetime-local yyyy-MM-ddThh:mm
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById("dataHora").value = local;
    document.getElementById("observacoes").value = r.observacoes || "";
    window.scrollTo({ top: 0, behavior: "smooth" });
};

window.cancelarReserva = async function (id) {
    if (!confirm("Tem certeza que deseja cancelar esta reserva?")) return;
    const res = await fetch(`${API_BASE}/reservas/${id}`, { method: "DELETE" });
    if (res.ok) {
        alert("Reserva cancelada");
        await fetchReservas();
    } else {
        const j = await res.json();
        alert("Erro: " + (j.error || "não foi possível cancelar"));
    }
};

reservaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = reservaIdInput.value;
    const payload = {
        cliente: document.getElementById("cliente").value,
        contato: document.getElementById("contato").value,
        mesa: Number(document.getElementById("mesaSelect").value),
        pessoas: Number(document.getElementById("pessoas").value),
        dataHora: document.getElementById("dataHora").value,
        observacoes: document.getElementById("observacoes").value
    };

    try {
        let res;
        if (id) {
            res = await fetch(`${API_BASE}/reservas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } else {
            res = await fetch(`${API_BASE}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }
        const j = await res.json();
        if (!res.ok) {
            alert("Erro: " + (j.error || JSON.stringify(j)));
        } else {
            alert(j.message || "Operação bem sucedida");
            reservaForm.reset();
            reservaIdInput.value = "";
            await fetchReservas();
        }
    } catch (err) {
        alert("Erro de rede: " + err.message);
    }
});

limparBtn.addEventListener("click", () => {
    reservaForm.reset();
    reservaIdInput.value = "";
});

btnFiltrar.addEventListener("click", () => {
    const cliente = filtroCliente.value.trim();
    const status = filtroStatus.value;
    const q = {};
    if (cliente) q.cliente = cliente;
    if (status) q.status = status;
    fetchReservas(q);
});

// inicialização
(async function init() {
    await fetchMesas();
    await fetchReservas();
    // atualizar periodicamente (opcional)
    setInterval(() => fetchReservas(), 30 * 1000);
})();
