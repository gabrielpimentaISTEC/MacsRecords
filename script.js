// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let catalogo = [];
let catalogoFiltrado = [];
let paginaAtual = 1;
const ITENS_POR_PAGINA = 12;

// Sistema de carrinho (via localStorage)
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

// ============================================
// FUNÇÕES DO CARRINHO
// ============================================

function salvarCarrinho() {
  localStorage.setItem('carrinho', JSON.stringify(carrinho));
  atualizarBadgeCarrinho();
}

function atualizarBadgeCarrinho() {
  const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
  const badge = document.getElementById('carrinhoBadge');
  if (badge) {
    if (totalItens > 0) {
      badge.textContent = totalItens;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }
}

function adicionarAoCarrinho(itemId, formato) {
  const item = catalogo.find(i => i.id === itemId);
  if (!item) return false;

  const preco = formato === 'vinil' ? item.precoVinil : item.precoCD;
  if (!preco) return false;

  const itemCarrinho = {
    id: item.id,
    nome: item.nome,
    artista: item.artista,
    imagem: item.imagem,
    formato: formato,
    preco: preco,
    quantidade: 1
  };

  const existente = carrinho.findIndex(c => c.id === itemId && c.formato === formato);
  if (existente >= 0) {
    carrinho[existente].quantidade += 1;
  } else {
    carrinho.push(itemCarrinho);
  }

  salvarCarrinho();
  return true;
}

function removerDoCarrinho(index) {
  carrinho.splice(index, 1);
  salvarCarrinho();
  mostrarCarrinho();
}

function atualizarQuantidadeCarrinho(index, novaQuantidade) {
  if (novaQuantidade <= 0) {
    removerDoCarrinho(index);
    return;
  }
  carrinho[index].quantidade = novaQuantidade;
  salvarCarrinho();
  mostrarCarrinho();
}

function calcularTotalCarrinho() {
  return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
}

function mostrarCarrinho() {
  const modalBody = document.getElementById('carrinhoModalBody');
  if (!modalBody) return;

  if (carrinho.length === 0) {
    modalBody.innerHTML = `
      <div class="text-center py-5">
        <i class="fa fa-shopping-cart fa-3x text-muted mb-3"></i>
        <p class="text-muted">O carrinho está vazio.</p>
      </div>
    `;
    return;
  }

  const total = calcularTotalCarrinho();
  let html = '<div class="list-group">';

  carrinho.forEach((item, index) => {
    const precoFormatado = formatarPreco(item.preco);
    const subtotal = formatarPreco(item.preco * item.quantidade);
    html += `
      <div class="list-group-item">
        <div class="d-flex align-items-center gap-3">
          <img src="${item.imagem}" alt="${item.nome}" class="rounded" style="width: 60px; height: 60px; object-fit: cover;">
          <div class="flex-grow-1">
            <h6 class="mb-1">${item.nome}</h6>
            <p class="mb-1 small text-muted">${item.artista} · ${item.formato === 'vinil' ? 'Vinil' : 'CD'}</p>
            <p class="mb-0"><strong>€${precoFormatado}</strong> cada</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <button class="btn btn-sm btn-outline-secondary" onclick="atualizarQuantidadeCarrinho(${index}, ${item.quantidade - 1})">-</button>
            <span class="fw-bold">${item.quantidade}</span>
            <button class="btn btn-sm btn-outline-secondary" onclick="atualizarQuantidadeCarrinho(${index}, ${item.quantidade + 1})">+</button>
            <button class="btn btn-sm btn-danger ms-2" onclick="removerDoCarrinho(${index})">
              <i class="fa fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="text-end mt-2">
          <small class="text-muted">Subtotal: <strong>€${subtotal}</strong></small>
        </div>
      </div>
    `;
  });

  html += '</div>';
  html += `
    <div class="mt-4 p-3 bg-light rounded">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Total:</h5>
        <h4 class="mb-0 text-primary">€${formatarPreco(total)}</h4>
      </div>
      <button class="btn btn-success w-100 mt-3" onclick="window.location.href='checkout.html'">
        Finalizar Pedido
      </button>
    </div>
  `;

  modalBody.innerHTML = html;
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function obterPrecoBase(item) {
  const precos = [];
  if (typeof item.precoVinil === "number") precos.push(item.precoVinil);
  if (typeof item.precoCD === "number") precos.push(item.precoCD);
  if (!precos.length) return 0;
  return Math.min(...precos);
}

function formatarPreco(preco) {
  if (preco == null || isNaN(preco)) return null;
  return preco.toFixed(2).replace(".", ",");
}

// ============================================
// CARREGAMENTO DE DADOS
// ============================================

// Detetar tipo de página
const isCatalogPage = document.getElementById("catalogo") !== null;
const isProdutoPage = document.getElementById("produtoDetalhes") !== null;

fetch("catalogo.json")
  .then(res => res.json())
  .then(data => {
    catalogo = data.catalogo;

    catalogo.forEach(item => {
      item.precoBase = obterPrecoBase(item);
    });

    // Ajustar min/max dos sliders de preço e ano com base no catálogo
    (function ajustarSliders() {
      const precoBases = catalogo.map(i => (typeof i.precoBase === 'number' ? i.precoBase : obterPrecoBase(i))).filter(n => n != null && !isNaN(n));
      let precoMinDefault = 0, precoMaxDefault = 50;
      if (precoBases.length) {
        const minP = Math.floor(Math.min(...precoBases));
        const maxP = Math.ceil(Math.max(...precoBases));
        precoMinDefault = Math.min(minP, maxP);
        precoMaxDefault = Math.max(maxP, precoMinDefault + 1);
      }

      const precoMinInput = document.getElementById('filtroPrecoMin');
      const precoMaxInput = document.getElementById('filtroPrecoMax');
      const precoMinLabel = document.getElementById('labelPrecoMin');
      const precoMaxLabel = document.getElementById('labelPrecoMax');

      if (precoMinInput && precoMaxInput) {
        precoMinInput.setAttribute('min', String(precoMinDefault));
        precoMinInput.setAttribute('max', String(precoMaxDefault));
        precoMaxInput.setAttribute('min', String(precoMinDefault));
        precoMaxInput.setAttribute('max', String(precoMaxDefault));
        precoMinInput.value = String(precoMinDefault);
        precoMaxInput.value = String(precoMaxDefault);
        if (precoMinLabel) precoMinLabel.textContent = String(precoMinDefault);
        if (precoMaxLabel) precoMaxLabel.textContent = String(precoMaxDefault);
      }

      const anos = catalogo.map(i => Number(i.ano)).filter(n => !isNaN(n));
      let anoMinDefault = 1960, anoMaxDefault = 2025;
      if (anos.length) {
        anoMinDefault = Math.min(...anos);
        anoMaxDefault = Math.max(...anos);
      }

      const anoMinInput = document.getElementById('filtroAnoMin');
      const anoMaxInput = document.getElementById('filtroAnoMax');
      const anoMinLabel = document.getElementById('labelAnoMin');
      const anoMaxLabel = document.getElementById('labelAnoMax');

      if (anoMinInput && anoMaxInput) {
        anoMinInput.setAttribute('min', String(anoMinDefault));
        anoMinInput.setAttribute('max', String(anoMaxDefault));
        anoMaxInput.setAttribute('min', String(anoMinDefault));
        anoMaxInput.setAttribute('max', String(anoMaxDefault));
        anoMinInput.value = String(anoMinDefault);
        anoMaxInput.value = String(anoMaxDefault);
        if (anoMinLabel) anoMinLabel.textContent = String(anoMinDefault);
        if (anoMaxLabel) anoMaxLabel.textContent = String(anoMaxDefault);
      }
    })();

    catalogoFiltrado = [...catalogo];
    paginaAtual = 1;

    if (isCatalogPage) {
      // Aplicar filtro inicial vindo da query string (por género)
      const params = new URLSearchParams(window.location.search);
      const generoParam = params.get("genero");
      if (generoParam) {
        document.querySelectorAll(".filtro-genero").forEach(cb => {
          cb.checked = (cb.value === generoParam);
        });
        aplicarFiltros();
      } else {
        mostrarCatalogoPaginado();
      }
    }

    if (isProdutoPage) {
      initProdutoPage();
    }
  });

function mostrarCatalogo(lista) {
  const container = document.getElementById("catalogo");
  if (!container) return;
  container.innerHTML = "";

  lista.forEach(item => {
    const precoVinilFormatado = formatarPreco(item.precoVinil);
    const precoCDFormatado = formatarPreco(item.precoCD);

    let precoDisplay = "Preço indisponível";
    if (precoVinilFormatado && precoCDFormatado) {
      precoDisplay = `Vinil: €${precoVinilFormatado} <br> CD: €${precoCDFormatado}`;
    } else if (precoVinilFormatado) {
      precoDisplay = `Vinil: €${precoVinilFormatado}`;
    } else if (precoCDFormatado) {
      precoDisplay = `CD: €${precoCDFormatado}`;
    }

    container.innerHTML += `
      <div class="col-xl-3 col-lg-4 col-md-6">
        <div class="card h-100">
          <img src="${item.imagem}" class="card-img-top">
          <div class="card-body text-center d-flex flex-column">
            <h5 class="card-title">${item.nome}</h5>
            <p class="mb-1"><strong>${item.artista}</strong></p>
            <p class="text-muted mb-2">${item.genero} · ${item.ano}</p>
            <p class="fw-bold mb-3">${precoDisplay}</p>
            <button type="button"
                    class="btn btn-primary mt-auto"
                    data-bs-toggle="modal"
                    data-bs-target="#detalhesModal"
                    onclick="abrirDetalhes(${item.id})">
              Ver detalhes
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

function abrirDetalhes(id) {
  const item = catalogo.find(i => i.id === id);
  if (!item) return;

  const tituloEl = document.getElementById("detalhesTitulo");
  const modalBody = document.querySelector("#detalhesModal .modal-body");
  if (!modalBody) return;

  if (tituloEl) {
    tituloEl.textContent = item.nome;
  }

  const precoVinilFormatado = formatarPreco(item.precoVinil);
  const precoCDFormatado = formatarPreco(item.precoCD);

  const spotifySrc = item.spotify || null;

  modalBody.innerHTML = `
    <div class="row g-4 align-items-stretch">
      <div class="col-md-5 modal-album-left d-flex flex-column">
        <div class="produto-cover-wrapper mb-3 flex-shrink-0">
          <img src="${item.imagem}" alt="${item.nome}" class="img-fluid rounded shadow produto-cover">
        </div>
        ${spotifySrc ? `
        <div class="spotify-embed rounded overflow-hidden shadow-sm mt-2 flex-grow-1">
          <iframe style="border-radius:12px" src="${spotifySrc}" width="100%" height="100%" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>` : `
        <p class="mt-2 small text-muted">Pré-visualização indisponível para este álbum.</p>
        `}
      </div>
      <div class="col-md-7 d-flex flex-column modal-album-right">
        <h4 class="mb-1">${item.nome}</h4>
        <h6 class="mb-1">${item.artista}</h6>
        <p class="text-muted mb-2">${item.genero} · ${item.ano}</p>
        <p class="mb-3">${item.descricao}</p>

        <div class="mb-2">
          <span class="badge bg-light text-dark me-2">Stock: ${item.stock}</span>
        </div>

        <div class="mb-3">
          <label class="form-label mb-1">Formato</label>
          <div>
            ${precoVinilFormatado ? `
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="formatoModal" id="modalFormatoVinil" value="vinil" checked>
              <label class="form-check-label" for="modalFormatoVinil">Vinil (€${precoVinilFormatado})</label>
            </div>` : ""}
            ${precoCDFormatado ? `
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="formatoModal" id="modalFormatoCD" value="cd" ${!precoVinilFormatado ? "checked" : ""}>
              <label class="form-check-label" for="modalFormatoCD">CD (€${precoCDFormatado})</label>
            </div>` : ""}
          </div>
        </div>

        <div class="mb-3">
          <p class="h5 mb-1" id="modalPrecoAtual"></p>
          <small class="text-muted" id="modalFormatoAtual"></small>
        </div>

        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-success" id="modalComprarAgora">Comprar agora</button>
          <button class="btn btn-outline-primary" id="modalAdicionarCarrinho">Adicionar ao carrinho</button>
        </div>
      </div>
    </div>
  `;

  const precoLabel = document.getElementById("modalPrecoAtual");
  const formatoLabel = document.getElementById("modalFormatoAtual");

  function atualizarPrecoFormatoModal() {
    const formato = document.querySelector("input[name='formatoModal']:checked")?.value;
    if (formato === "vinil") {
      precoLabel.textContent = precoVinilFormatado ? `€${precoVinilFormatado}` : "";
      formatoLabel.textContent = "Formato selecionado: Vinil";
    } else if (formato === "cd") {
      precoLabel.textContent = precoCDFormatado ? `€${precoCDFormatado}` : "";
      formatoLabel.textContent = "Formato selecionado: CD";
    } else {
      precoLabel.textContent = "";
      formatoLabel.textContent = "";
    }
  }

  atualizarPrecoFormatoModal();

  document.querySelectorAll("input[name='formatoModal']").forEach(r => {
    r.addEventListener("change", atualizarPrecoFormatoModal);
  });

  const btnComprar = document.getElementById("modalComprarAgora");
  const btnCarrinho = document.getElementById("modalAdicionarCarrinho");

  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      const formato = document.querySelector("input[name='formatoModal']:checked")?.value;
      if (!formato) {
        alert("Por favor, selecione um formato.");
        return;
      }
      if (adicionarAoCarrinho(id, formato)) {
        const modal = bootstrap.Modal.getInstance(document.getElementById("detalhesModal"));
        if (modal) modal.hide();
        window.location.href = 'checkout.html';
      } else {
        alert("Erro ao adicionar ao carrinho.");
      }
    });
  }
  if (btnCarrinho) {
    btnCarrinho.addEventListener("click", () => {
      const formato = document.querySelector("input[name='formatoModal']:checked")?.value;
      if (!formato) {
        alert("Por favor, selecione um formato.");
        return;
      }
      if (adicionarAoCarrinho(id, formato)) {
        const modal = bootstrap.Modal.getInstance(document.getElementById("detalhesModal"));
        if (modal) modal.hide();
        mostrarCarrinho();
        const carrinhoModal = new bootstrap.Modal(document.getElementById("carrinhoModal"));
        carrinhoModal.show();
      } else {
        alert("Erro ao adicionar ao carrinho.");
      }
    });
  }
}

function mostrarCatalogoPaginado() {
  const totalItens = catalogoFiltrado.length;
  const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
  const fim = inicio + ITENS_POR_PAGINA;
  const paginaItens = catalogoFiltrado.slice(inicio, fim);

  mostrarCatalogo(paginaItens);
  renderPaginacao(totalItens);
}

function renderPaginacao(totalItens) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / ITENS_POR_PAGINA));
  const paginacaoEl = document.getElementById("paginacao");
  if (!paginacaoEl) return;

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }

  let html = `<ul class="pagination justify-content-center">`;

  // Anterior
  const prevDisabled = paginaAtual === 1 ? " disabled" : "";
  html += `
    <li class="page-item${prevDisabled}">
      <button class="page-link" data-page="${paginaAtual - 1}" ${prevDisabled ? "tabindex='-1' aria-disabled='true'" : ""}>&laquo;</button>
    </li>
  `;

  for (let p = 1; p <= totalPaginas; p++) {
    const active = p === paginaAtual ? " active" : "";
    html += `
      <li class="page-item${active}">
        <button class="page-link" data-page="${p}">${p}</button>
      </li>
    `;
  }

  // Seguinte
  const nextDisabled = paginaAtual === totalPaginas ? " disabled" : "";
  html += `
    <li class="page-item${nextDisabled}">
      <button class="page-link" data-page="${paginaAtual + 1}" ${nextDisabled ? "tabindex='-1' aria-disabled='true'" : ""}>&raquo;</button>
    </li>
  `;

  html += `</ul>`;
  paginacaoEl.innerHTML = html;

  paginacaoEl.querySelectorAll("button.page-link").forEach(btn => {
    const page = Number(btn.getAttribute("data-page"));
    if (!page || page < 1 || page > totalPaginas) return;
    btn.addEventListener("click", () => {
      paginaAtual = page;
      mostrarCatalogoPaginado();
    });
  });
}

// ============================================
// FILTROS E ORDENAÇÃO
// ============================================

function aplicarFiltros() {
  function normalize(str) {
    return (str || "").toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function parseNumberInput(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const v = el.value;
    if (v === "" || v == null) return null;
    const n = Number(v);
    if (isNaN(n)) return null;
    // Se o valor é igual ao limite (min para inputs "Min", max para "Max"), tratar como não filtrado
    const minAttr = el.getAttribute('min');
    const maxAttr = el.getAttribute('max');
    if (id.toLowerCase().includes('min') && minAttr != null && String(n) === String(minAttr)) return null;
    if (id.toLowerCase().includes('max') && maxAttr != null && String(n) === String(maxAttr)) return null;
    return n;
  }

  const pesquisaEl = document.getElementById("filtroPesquisa");
  const ordenacaoEl = document.getElementById("filtroOrdenacao");
  const pesquisa = pesquisaEl ? normalize(pesquisaEl.value.trim()) : "";
  const ordenacao = ordenacaoEl ? ordenacaoEl.value : "";

  const generoEls = Array.from(document.querySelectorAll(".filtro-genero"));
  // Usar atributo data-normalizado se existir, senão normalizar o value
  const generosSelecionados = generoEls.filter(e => e.checked).map(e => e.dataset.normalizado || normalize(e.value.trim()));

  const btnGenero = document.getElementById("btnGeneroDropdown");
  if (btnGenero) {
    if (!generosSelecionados.length) {
      btnGenero.textContent = "Selecionar género";
    } else {
      btnGenero.textContent = generoEls.filter(e => e.checked).map(e => e.value.trim()).join(", ");
    }
  }

  const precoMin = parseNumberInput("filtroPrecoMin");
  const precoMax = parseNumberInput("filtroPrecoMax");
  const anoMin = parseNumberInput("filtroAnoMin");
  const anoMax = parseNumberInput("filtroAnoMax");

  let filtrado = catalogo.filter(item => {
    // Se não houver filtros ativos, retorna tudo
    const nenhumFiltro = !pesquisa && !generosSelecionados.length && precoMin == null && precoMax == null && anoMin == null && anoMax == null;
    if (nenhumFiltro) return true;

    if (pesquisa) {
      const nome = normalize(item.nome);
      const artista = normalize(item.artista);
      if (!nome.includes(pesquisa) && !artista.includes(pesquisa)) return false;
    }

    if (generosSelecionados.length) {
      const itemGenero = normalize(item.genero || "");
      const match = generosSelecionados.some(gen => gen === itemGenero || itemGenero.includes(gen) || gen.includes(itemGenero));
      if (!match) return false;
    }

    const precoBase = typeof item.precoBase === "number" ? item.precoBase : obterPrecoBase(item);
    if (precoMin != null && precoBase < precoMin) return false;
    if (precoMax != null && precoBase > precoMax) return false;

    const itemAno = typeof item.ano === 'number' ? item.ano : Number(item.ano);
    if (anoMin != null && itemAno < anoMin) return false;
    if (anoMax != null && itemAno > anoMax) return false;

    return true;
  });

  if (ordenacao === "nome-asc") {
    filtrado.sort((a, b) => a.nome.localeCompare(b.nome));
  } else if (ordenacao === "preco-asc") {
    filtrado.sort((a, b) => {
      const pa = typeof a.precoBase === "number" ? a.precoBase : obterPrecoBase(a);
      const pb = typeof b.precoBase === "number" ? b.precoBase : obterPrecoBase(b);
      return pa - pb;
    });
  } else if (ordenacao === "preco-desc") {
    filtrado.sort((a, b) => {
      const pa = typeof a.precoBase === "number" ? a.precoBase : obterPrecoBase(a);
      const pb = typeof b.precoBase === "number" ? b.precoBase : obterPrecoBase(b);
      return pb - pa;
    });
  }

  catalogoFiltrado = filtrado;
  paginaAtual = 1;
  mostrarCatalogoPaginado();
}

// ============================================
// INICIALIZAÇÃO E EVENT LISTENERS
// ============================================

document.addEventListener("DOMContentLoaded", () => {
  atualizarBadgeCarrinho();
  
  // Filtros de pesquisa
  const inputPesquisa = document.getElementById("filtroPesquisa");
  if (inputPesquisa) {
    inputPesquisa.addEventListener("input", aplicarFiltros);
  }

  const selectOrdenacao = document.getElementById("filtroOrdenacao");
  if (selectOrdenacao) {
    selectOrdenacao.addEventListener("change", aplicarFiltros);
  }

  document.querySelectorAll(".filtro-genero").forEach(el => {
    el.addEventListener("change", aplicarFiltros);
  });

  // Range sliders de preço
  const precoMinInput = document.getElementById("filtroPrecoMin");
  const precoMaxInput = document.getElementById("filtroPrecoMax");
  const precoMinLabel = document.getElementById("labelPrecoMin");
  const precoMaxLabel = document.getElementById("labelPrecoMax");

  const syncPreco = () => {
    if (!precoMinInput || !precoMaxInput) return;

    let minVal = Number(precoMinInput.value);
    let maxVal = Number(precoMaxInput.value);

    if (minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
      precoMinInput.value = String(minVal);
      precoMaxInput.value = String(maxVal);
    }

    if (precoMinLabel) precoMinLabel.textContent = precoMinInput.value;
    if (precoMaxLabel) precoMaxLabel.textContent = precoMaxInput.value;
    aplicarFiltros();
  };

  if (precoMinInput && precoMaxInput) {
    precoMinInput.addEventListener("input", syncPreco);
    precoMaxInput.addEventListener("input", syncPreco);
    syncPreco();
  }

  // Range sliders de ano
  const anoMinInput = document.getElementById("filtroAnoMin");
  const anoMaxInput = document.getElementById("filtroAnoMax");
  const anoMinLabel = document.getElementById("labelAnoMin");
  const anoMaxLabel = document.getElementById("labelAnoMax");

  const syncAno = () => {
    if (!anoMinInput || !anoMaxInput) return;

    let minVal = Number(anoMinInput.value);
    let maxVal = Number(anoMaxInput.value);

    if (minVal > maxVal) {
      const temp = minVal;
      minVal = maxVal;
      maxVal = temp;
      anoMinInput.value = String(minVal);
      anoMaxInput.value = String(maxVal);
    }

    if (anoMinLabel) anoMinLabel.textContent = anoMinInput.value;
    if (anoMaxLabel) anoMaxLabel.textContent = anoMaxInput.value;
    aplicarFiltros();
  };

  if (anoMinInput && anoMaxInput) {
    anoMinInput.addEventListener("input", syncAno);
    anoMaxInput.addEventListener("input", syncAno);
    syncAno();
  }

  // Modal do carrinho
  const carrinhoModalEl = document.getElementById("carrinhoModal");
  if (carrinhoModalEl) {
    carrinhoModalEl.addEventListener("show.bs.modal", mostrarCarrinho);
  }
});

// ============================================
// PÁGINA DE PRODUTO
// ============================================

function initProdutoPage() {
  const container = document.getElementById("produtoDetalhes");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const idParam = Number(params.get("id"));
  if (!idParam) {
    container.innerHTML = "<p class='text-white'>Produto não encontrado.</p>";
    return;
  }

  const item = catalogo.find(i => i.id === idParam);
  if (!item) {
    container.innerHTML = "<p class='text-white'>Produto não encontrado.</p>";
    return;
  }

  const precoVinilFormatado = formatarPreco(item.precoVinil);
  const precoCDFormatado = formatarPreco(item.precoCD);

  const spotifySrc = item.spotify || null;

  container.innerHTML = `
    <div class="row g-4 align-items-start text-white">
      <div class="col-md-5">
        <div class="produto-cover-wrapper mb-3">
          <img src="${item.imagem}" alt="${item.nome}" class="img-fluid rounded shadow produto-cover">
        </div>
        ${spotifySrc ? `
        <div class="spotify-embed rounded overflow-hidden shadow-sm">
          <iframe style="border-radius:12px" src="${spotifySrc}" width="100%" height="380" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
        </div>` : `
        <p class="mt-2 small text-muted">Pré-visualização indisponível para este álbum.</p>
        `}
      </div>
      <div class="col-md-7">
        <h1 class="fw-bold mb-2">${item.nome}</h1>
        <h4 class="mb-1">${item.artista}</h4>
        <p class="text-muted mb-3">${item.genero} · ${item.ano}</p>
        <p class="mb-4">${item.descricao}</p>

        <div class="mb-3">
          <span class="badge bg-light text-dark me-2">Stock: ${item.stock}</span>
        </div>

        <div class="mb-3">
          <label class="form-label">Formato</label>
          <div>
            ${precoVinilFormatado ? `
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="formatoProduto" id="formatoVinil" value="vinil" checked>
              <label class="form-check-label" for="formatoVinil">Vinil (€${precoVinilFormatado})</label>
            </div>` : ""}
            ${precoCDFormatado ? `
            <div class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="formatoProduto" id="formatoCD" value="cd" ${!precoVinilFormatado ? "checked" : ""}>
              <label class="form-check-label" for="formatoCD">CD (€${precoCDFormatado})</label>
            </div>` : ""}
          </div>
        </div>

        <div class="mb-4">
          <p class="h4 mb-1" id="produtoPrecoAtual"></p>
          <small class="text-muted" id="produtoFormatoAtual"></small>
        </div>

        <div class="d-flex gap-3">
          <button class="btn btn-success btn-lg" id="btnComprarAgora">Comprar agora</button>
          <button class="btn btn-outline-light btn-lg" id="btnAdicionarCarrinho">Adicionar ao carrinho</button>
        </div>
      </div>
    </div>
  `;

  const precoLabel = document.getElementById("produtoPrecoAtual");
  const formatoLabel = document.getElementById("produtoFormatoAtual");

  function atualizarPrecoFormato() {
    const formato = document.querySelector("input[name='formatoProduto']:checked")?.value;
    if (formato === "vinil") {
      precoLabel.textContent = `€${precoVinilFormatado}`;
      formatoLabel.textContent = "Formato selecionado: Vinil";
    } else if (formato === "cd") {
      precoLabel.textContent = `€${precoCDFormatado}`;
      formatoLabel.textContent = "Formato selecionado: CD";
    } else {
      precoLabel.textContent = "";
      formatoLabel.textContent = "";
    }
  }

  atualizarPrecoFormato();

  document.querySelectorAll("input[name='formatoProduto']").forEach(r => {
    r.addEventListener("change", atualizarPrecoFormato);
  });

  const btnComprar = document.getElementById("btnComprarAgora");
  const btnCarrinho = document.getElementById("btnAdicionarCarrinho");

  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      const formato = document.querySelector("input[name='formatoProduto']:checked")?.value;
      if (!formato) {
        alert("Por favor, selecione um formato.");
        return;
      }
      if (adicionarAoCarrinho(idParam, formato)) {
        window.location.href = 'checkout.html';
      } else {
        alert("Erro ao adicionar ao carrinho.");
      }
    });
  }
  if (btnCarrinho) {
    btnCarrinho.addEventListener("click", () => {
      const formato = document.querySelector("input[name='formatoProduto']:checked")?.value;
      if (!formato) {
        alert("Por favor, selecione um formato.");
        return;
      }
      if (adicionarAoCarrinho(idParam, formato)) {
        alert("Produto adicionado ao carrinho!");
      } else {
        alert("Erro ao adicionar ao carrinho.");
      }
    });
  }
}
