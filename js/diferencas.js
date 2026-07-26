// =====================================================================
// DIFERENÇAS – GUIA 4 (FASE 1.5 COM PROPORCIONALIDADE 30 DIAS)
// =====================================================================

var dadosDiferencas = {
    modoCompensacao: 'limite',
    celulasEditadas: {},
};

// =====================================================================
// FUNÇÃO AUXILIAR PARA CONVERTER COMPETÊNCIA (ACEITA MM/AAAA OU DD/MM/AAAA)
// =====================================================================
function converterCompetenciaParaNumero(str) {
    if (!str) return NaN;
    const partes = str.split('/');
    let mes, ano;
    if (partes.length === 3) {
        mes = parseInt(partes[1], 10);
        ano = parseInt(partes[2], 10);
    } else if (partes.length === 2) {
        mes = parseInt(partes[0], 10);
        ano = parseInt(partes[1], 10);
    } else {
        return NaN;
    }
    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 1900) return NaN;
    return ano * 100 + mes;
}

// =====================================================================
// FUNÇÕES DE PROPORCIONALIDADE – MÊS COMERCIAL DE 30 DIAS
// =====================================================================

function parseDataProporcional30(str) {
    if (!str) return null;
    const limpo = str.trim();
    const partes = limpo.split('/');
    let dia, mes, ano;
    if (partes.length === 3) {
        dia = parseInt(partes[0], 10);
        mes = parseInt(partes[1], 10);
        ano = parseInt(partes[2], 10);
    } else if (partes.length === 2) {
        dia = 1; // MM/AAAA → dia 1
        mes = parseInt(partes[0], 10);
        ano = parseInt(partes[1], 10);
    } else {
        return null;
    }
    if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 1900) return null;
    if (!isNaN(dia) && dia > 31) return null;
    // Normaliza dia 31 para 30
    if (dia > 30) dia = 30;
    return { dia, mes, ano };
}

function normalizarDia30(dia) {
    return dia > 30 ? 30 : dia;
}

// Função de comparação de datas completas (considera ano, mês, dia)
function compararDataProporcional30(a, b) {
    if (!a && !b) return 0;
    if (!a) return -1;
    if (!b) return 1;
    if (a.ano !== b.ano) return a.ano - b.ano;
    if (a.mes !== b.mes) return a.mes - b.mes;
    return a.dia - b.dia;
}

function maxDataProporcional30(a, b) {
    return compararDataProporcional30(a, b) >= 0 ? a : b;
}

function minDataProporcional30(a, b) {
    return compararDataProporcional30(a, b) <= 0 ? a : b;
}

function calcularDiasAtivos30(mes, ano, dataInicio, dataFim) {
    // dataInicio e dataFim são objetos { dia, mes, ano } ou null
    // Se null, considera-se início = 1, fim = 30 (mês completo)
    const inicioDia = dataInicio ? normalizarDia30(dataInicio.dia) : 1;
    const fimDia = dataFim ? normalizarDia30(dataFim.dia) : 30;

    // Se o mês/ano não estiver dentro do intervalo, retorna 0
    if (dataInicio) {
        const numInicio = dataInicio.ano * 100 + dataInicio.mes;
        const numAtual = ano * 100 + mes;
        if (numAtual < numInicio) return 0;
    }
    if (dataFim) {
        const numFim = dataFim.ano * 100 + dataFim.mes;
        const numAtual = ano * 100 + mes;
        if (numAtual > numFim) return 0;
    }

    // Ajusta dia de início e fim para o mês atual
    let diaInicio = 1;
    let diaFim = 30;
    if (dataInicio && dataInicio.mes === mes && dataInicio.ano === ano) {
        diaInicio = inicioDia;
    }
    if (dataFim && dataFim.mes === mes && dataFim.ano === ano) {
        diaFim = fimDia;
    }

    // Se o mês está dentro, mas as datas não cruzam o mês atual (ex: início no futuro)
    if (dataInicio) {
        const numInicio = dataInicio.ano * 100 + dataInicio.mes;
        const numAtual = ano * 100 + mes;
        if (numAtual < numInicio) return 0;
        if (numAtual === numInicio && diaInicio > 30) return 0;
    }
    if (dataFim) {
        const numFim = dataFim.ano * 100 + dataFim.mes;
        const numAtual = ano * 100 + mes;
        if (numAtual > numFim) return 0;
        if (numAtual === numFim && diaFim < 1) return 0;
    }

    // Calcula interseção no mês atual
    let inicio = Math.max(1, diaInicio);
    let fim = Math.min(30, diaFim);
    if (inicio > fim) return 0;
    return fim - inicio + 1;
}

function calcularFracaoAtiva(mes, ano, dataInicio, dataFim) {
    const dias = calcularDiasAtivos30(mes, ano, dataInicio, dataFim);
    if (dias === 0) return 0;
    return dias / 30;
}

function obterDataInicioAnalise() {
    const termo = document.getElementById('termoInicialDiferencas').value;
    return parseDataProporcional30(termo);
}

function obterDataFimAnalise() {
    const dataFinal = document.getElementById('dataFinal').value;
    const parsed = parseDataProporcional30(dataFinal);
    if (parsed) {
        parsed.dia = 30; // Data final sempre dia 30
    }
    return parsed;
}

function obterFracaoDevida(mes, ano) {
    const dib = document.getElementById('dib').value;
    const dataDib = parseDataProporcional30(dib);
    const dataInicioAnalise = obterDataInicioAnalise();
    const dataFimAnalise = obterDataFimAnalise();

    if (!dataDib || !dataInicioAnalise || !dataFimAnalise) {
        console.warn('[FracaoDevida] Data inválida, fração 0');
        return 0;
    }

    // Início = max(DIB, TermoInicial) comparando data completa
    const inicio = maxDataProporcional30(dataDib, dataInicioAnalise);
    const fim = dataFimAnalise;

    return calcularFracaoAtiva(mes, ano, inicio, fim);
}

function obterFracaoRecebida(mes, ano, ben) {
    const dip = ben.dip || ben.dib;
    const dataDib = parseDataProporcional30(ben.dib);
    const dataDip = parseDataProporcional30(dip);
    const dataDcb = ben.dcb ? parseDataProporcional30(ben.dcb) : null;
    const dataInicioAnalise = obterDataInicioAnalise();
    const dataFimAnalise = obterDataFimAnalise();

    if (!dataDib || !dataInicioAnalise || !dataFimAnalise) {
        console.warn('[FracaoRecebida] Data inválida, fração 0');
        return 0;
    }

    // Início = max(DIP ou DIB, TermoInicial) comparando data completa
    const inicioDia = dataDip || dataDib;
    const inicio = maxDataProporcional30(inicioDia, dataInicioAnalise);

    // Fim = min(DCB ou DataFinal, DataFinal) comparando data completa
    const fimOriginal = dataDcb || dataFimAnalise;
    const fim = minDataProporcional30(fimOriginal, dataFimAnalise);

    return calcularFracaoAtiva(mes, ano, inicio, fim);
}

// =====================================================================
// FUNÇÃO PARA OBTER VALOR INTEGRAL (CARRY-OVER) – COM FALLBACK
// =====================================================================

function obterValorIntegral(memoria, competencia, rmi, rmaFinal) {
    if (!memoria || memoria.length === 0) {
        return rmaFinal || rmi || 0;
    }
    let valor = rmi || 0;
    const numComp = converterCompetenciaParaNumero(competencia);
    for (let item of memoria) {
        const numItem = converterCompetenciaParaNumero(item.competencia);
        if (!isNaN(numItem) && numItem <= numComp) {
            valor = item.valorFinal;
        } else {
            break;
        }
    }
    return valor;
}

// =====================================================================
// FUNÇÃO PRINCIPAL: MONTAR TABELA DE DIFERENÇAS (COM PROPORCIONALIDADE)
// =====================================================================

function montarTabelaDiferencas() {
    const tbody = document.getElementById('corpoDiferencas');
    const resumoDiv = document.getElementById('resumoDiferencas');

    const termoInicial = document.getElementById('termoInicialDiferencas').value;
    const dataFinal = document.getElementById('dataFinal').value;

    if (!termoInicial || !dataFinal) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-400">Defina o Termo Inicial das Diferenças e a Data Final de Evolução na guia Entradas.</td></tr>`;
        resumoDiv.classList.add('hidden');
        return;
    }

    const listaCompetencias = gerarCompetencias(termoInicial, dataFinal);
    if (listaCompetencias.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" class="p-4 text-center text-slate-400">O Termo Inicial não pode ser posterior à Data Final.</td></tr>`;
        resumoDiv.classList.add('hidden');
        return;
    }

    const memoriaDevida = window.memoriaEvolucaoDevida || [];
    const rmiDevida = parseFloat(document.getElementById('rmi').value.replace(/\./g, '').replace(',', '.')) || 0;

    const beneficiosRecebidos = [];
    const blocos = document.querySelectorAll('.beneficio-recebido-bloco');

    blocos.forEach(bloco => {
        const nb = bloco.querySelector('[data-campo="nb"]')?.value || 'Benefício';
        const especie = bloco.querySelector('[data-campo="especie"]')?.value || '';
        const id = bloco.dataset.id || `ben-${beneficiosRecebidos.length+1}`;
        const dib = bloco.querySelector('[data-campo="dib"]')?.value || '';
        const dip = bloco.querySelector('[data-campo="dip"]')?.value || '';
        const dcb = bloco.querySelector('[data-campo="dcb"]')?.value || '';
        const rmiStr = bloco.querySelector('[data-campo="rmi"]')?.value || '0';
        const rmi = parseFloat(rmiStr.replace(/\./g, '').replace(',', '.')) || 0;

        const resultadoStr = bloco.dataset.resultado;
        let memoria = [];
        let rmaFinal = rmi;

        if (resultadoStr) {
            try {
                const resultado = JSON.parse(resultadoStr);
                memoria = resultado.memoria || [];
                rmaFinal = resultado.rmaFinal || rmi;
            } catch(e) {
                console.warn('[Guia 4] Erro ao parsear resultado do bloco', id, e);
            }
        }

        beneficiosRecebidos.push({
            id,
            nb,
            especie,
            memoria: memoria,
            label: `NB ${nb} ${especie ? 'ESPÉCIE ' + especie : ''}`.trim(),
            dib,
            dip,
            dcb,
            rmi,
            rmaFinal: rmaFinal
        });
    });

    const thead = document.querySelector('#tabelaDiferencas thead tr');
    while (thead.children.length > 2) {
        thead.removeChild(thead.lastChild);
    }

    beneficiosRecebidos.forEach((ben, idx) => {
        const th = document.createElement('th');
        th.className = 'p-3 min-w-[110px]';
        th.textContent = ben.label || `Benefício Recebido ${idx+1}`;
        th.dataset.beneficioId = ben.id;
        thead.appendChild(th);
    });

    const thTotal = document.createElement('th');
    thTotal.className = 'p-3 min-w-[110px]';
    thTotal.textContent = 'Total Recebido';
    thead.appendChild(thTotal);

    const thDiff = document.createElement('th');
    thDiff.className = 'p-3 min-w-[110px]';
    thDiff.textContent = 'Diferença Devida';
    thead.appendChild(thDiff);

    const thObs = document.createElement('th');
    thObs.className = 'p-3 min-w-[100px]';
    thObs.textContent = 'Observações';
    thead.appendChild(thObs);

    tbody.innerHTML = '';
    let rowIndex = 0;

    listaCompetencias.forEach(comp => {
        const compNum = converterCompetenciaParaNumero(comp);
        if (isNaN(compNum)) return;

        // ----- Valor devido com proporcionalidade -----
        const fracaoDevida = obterFracaoDevida(parseInt(comp.split('/')[0]), parseInt(comp.split('/')[1]));
        const valorIntegralDevido = obterValorIntegral(memoriaDevida, comp, rmiDevida);
        const devido = Math.round(valorIntegralDevido * fracaoDevida * 100) / 100;

        const tr = document.createElement('tr');
        tr.dataset.competencia = comp;
        tr.className = (rowIndex % 2 === 0) ? 'bg-gray-100 hover:bg-blue-100' : 'bg-white hover:bg-blue-100';
        rowIndex++;

        const tdComp = document.createElement('td');
        tdComp.className = 'p-3 font-semibold sticky-left bg-inherit';
        tdComp.textContent = comp;
        tr.appendChild(tdComp);

        const tdDevido = document.createElement('td');
        tdDevido.className = 'p-3';
        tdDevido.textContent = formatarNumero(devido);
        tr.appendChild(tdDevido);

        let somaRecebido = 0;

        beneficiosRecebidos.forEach(ben => {
            const td = document.createElement('td');
            td.className = 'p-3';
            td.dataset.beneficioId = ben.id;

            // Valor integral do recebido
            const valorIntegralRecebido = obterValorIntegral(ben.memoria, comp, ben.rmi, ben.rmaFinal);
            const fracao = obterFracaoRecebida(parseInt(comp.split('/')[0]), parseInt(comp.split('/')[1]), ben);
            let valorProporcional = Math.round(valorIntegralRecebido * fracao * 100) / 100;

            const chaveCelula = `${comp}|${ben.id}`;
            if (dadosDiferencas.celulasEditadas[chaveCelula] !== undefined) {
                valorProporcional = dadosDiferencas.celulasEditadas[chaveCelula];
                td.classList.add('celula-editada');
            }

            const input = document.createElement('input');
            input.type = 'text';
            input.value = formatarNumero(valorProporcional);
            input.className = 'w-full bg-transparent';
            input.addEventListener('focus', function() {
                this.select();
            });
            input.addEventListener('blur', function() {
                let novoValor = parseFloat(this.value.replace(/\./g, '').replace(',', '.'));
                if (isNaN(novoValor)) novoValor = 0;
                novoValor = Math.round(novoValor * 100) / 100;
                const chave = `${comp}|${ben.id}`;
                const original = Math.round(valorIntegralRecebido * fracao * 100) / 100;
                if (novoValor !== original) {
                    dadosDiferencas.celulasEditadas[chave] = novoValor;
                    td.classList.add('celula-editada');
                } else {
                    delete dadosDiferencas.celulasEditadas[chave];
                    td.classList.remove('celula-editada');
                }
                recalcularLinha(tr, beneficiosRecebidos);
                atualizarResumo();
            });
            td.appendChild(input);
            tr.appendChild(td);

            somaRecebido += valorProporcional;
        });

        // Total Recebido (com classe)
        const tdTotal = document.createElement('td');
        tdTotal.className = 'p-3 font-semibold total-recebido';
        tdTotal.textContent = formatarNumero(somaRecebido);
        tr.appendChild(tdTotal);

        // Diferença (com classe)
        let diferenca = 0;
        if (dadosDiferencas.modoCompensacao === 'limite') {
            diferenca = Math.max(0, devido - somaRecebido);
        } else {
            diferenca = devido - somaRecebido;
        }
        const tdDiff = document.createElement('td');
        tdDiff.className = 'p-3 font-bold diferenca-devida';
        tdDiff.textContent = formatarNumero(diferenca);
        if (diferenca < 0) tdDiff.style.color = '#dc2626';
        else if (diferenca > 0) tdDiff.style.color = '#16a34a';
        tr.appendChild(tdDiff);

        const tdObs = document.createElement('td');
        tdObs.className = 'p-3 text-slate-400 text-xs';
        tdObs.textContent = '-';
        tr.appendChild(tdObs);

        tbody.appendChild(tr);
    });

    atualizarResumo();
    document.getElementById('qtdCompetencias').textContent = listaCompetencias.length;
    resumoDiv.classList.remove('hidden');
}

// =====================================================================
// RECALCULAR LINHA APÓS EDIÇÃO MANUAL
// =====================================================================

function recalcularLinha(tr, beneficiosRecebidos) {
    const comp = tr.dataset.competencia;
    const tds = tr.querySelectorAll('td');
    const numBeneficios = beneficiosRecebidos.length;

    const devido = parseFloat(tds[1].textContent.replace(/\./g, '').replace(',', '.')) || 0;

    let somaRecebido = 0;
    for (let i = 0; i < numBeneficios; i++) {
        const td = tds[2 + i];
        const input = td.querySelector('input');
        if (input) {
            const val = parseFloat(input.value.replace(/\./g, '').replace(',', '.')) || 0;
            somaRecebido += val;
        }
    }

    const tdTotal = tr.querySelector('.total-recebido');
    if (tdTotal) tdTotal.textContent = formatarNumero(somaRecebido);

    const tdDiff = tr.querySelector('.diferenca-devida');
    if (tdDiff) {
        let diferenca = 0;
        if (dadosDiferencas.modoCompensacao === 'limite') {
            diferenca = Math.max(0, devido - somaRecebido);
        } else {
            diferenca = devido - somaRecebido;
        }
        tdDiff.textContent = formatarNumero(diferenca);
        if (diferenca < 0) tdDiff.style.color = '#dc2626';
        else if (diferenca > 0) tdDiff.style.color = '#16a34a';
        else tdDiff.style.color = 'inherit';
    }
}

// =====================================================================
// ATUALIZAR RESUMO GERAL – USANDO CLASSES PARA EVITAR BUG
// =====================================================================

function atualizarResumo() {
    let totalDevido = 0, totalRecebido = 0, diferencaTotal = 0, qtdEditadas = 0;
    
    document.querySelectorAll('#corpoDiferencas tr').forEach(tr => {
        const tds = tr.querySelectorAll('td');
        if (tds.length < 3) return;
        
        const devido = parseFloat(tds[1].textContent.replace(/\./g, '').replace(',', '.')) || 0;
        const totalEl = tr.querySelector('.total-recebido');
        const total = totalEl ? parseFloat(totalEl.textContent.replace(/\./g, '').replace(',', '.')) || 0 : 0;
        
        totalDevido += devido;
        totalRecebido += total;
        
        if (dadosDiferencas.modoCompensacao === 'limite') {
            diferencaTotal += Math.max(0, devido - total);
        } else {
            diferencaTotal += (devido - total);
        }
        
        tds.forEach(td => {
            if (td.classList.contains('celula-editada')) qtdEditadas++;
        });
    });
    
    document.getElementById('totalDevido').textContent = formatarMoeda(totalDevido);
    document.getElementById('totalRecebido').textContent = formatarMoeda(totalRecebido);
    document.getElementById('diferencaTotal').textContent = formatarMoeda(diferencaTotal);
    document.getElementById('qtdEditadas').textContent = qtdEditadas;
}

// =====================================================================
// EXPORTAR E IMPORTAR DADOS DA GUIA 4
// =====================================================================

function coletarDadosDiferencas() {
    return {
        modoCompensacao: dadosDiferencas.modoCompensacao,
        celulasEditadas: dadosDiferencas.celulasEditadas
    };
}

function restaurarDadosDiferencas(dados) {
    if (dados) {
        dadosDiferencas.modoCompensacao = dados.modoCompensacao || 'limite';
        dadosDiferencas.celulasEditadas = dados.celulasEditadas || {};
        const radio = document.querySelector(`input[name="modoCompensacao"][value="${dadosDiferencas.modoCompensacao}"]`);
        if (radio) radio.checked = true;
        montarTabelaDiferencas();
    }
}

// =====================================================================
// INICIALIZAR EVENTOS DA GUIA 4
// =====================================================================

function initGuiaDiferencas() {
    document.querySelectorAll('input[name="modoCompensacao"]').forEach(radio => {
        radio.addEventListener('change', function() {
            dadosDiferencas.modoCompensacao = this.value;
            montarTabelaDiferencas();
        });
    });

    const btnTema = document.getElementById('btnTemaSTJ');
    const modal = document.getElementById('modalTemaSTJ');
    const fechar = document.getElementById('fecharModalSTJ');
    if (btnTema && modal && fechar) {
        btnTema.addEventListener('click', () => modal.classList.remove('hidden'));
        fechar.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }
}

// =====================================================================
// FUNÇÃO AUXILIAR GERAR COMPETÊNCIAS (CORRIGIDA PARA ACEITAR DD/MM/AAAA)
// =====================================================================

function gerarCompetencias(inicio, fim) {
    if (!inicio || !fim) return [];
    
    // Extrai mês e ano independente do formato (MM/AAAA ou DD/MM/AAAA)
    const extrairMesAno = (str) => {
        const partes = str.split('/');
        let mes, ano;
        if (partes.length === 3) {
            // DD/MM/AAAA
            mes = parseInt(partes[1], 10);
            ano = parseInt(partes[2], 10);
        } else if (partes.length === 2) {
            // MM/AAAA
            mes = parseInt(partes[0], 10);
            ano = parseInt(partes[1], 10);
        } else {
            return null;
        }
        if (isNaN(mes) || isNaN(ano) || mes < 1 || mes > 12 || ano < 1900) return null;
        return { mes, ano };
    };
    
    const start = extrairMesAno(inicio);
    const end = extrairMesAno(fim);
    if (!start || !end) return [];
    
    if (start.ano > end.ano || (start.ano === end.ano && start.mes > end.mes)) return [];

    const lista = [];
    let currentMes = start.mes;
    let currentAno = start.ano;
    const endMonths = end.ano * 12 + end.mes;

    while (currentAno * 12 + currentMes <= endMonths) {
        lista.push(String(currentMes).padStart(2, '0') + '/' + currentAno);
        if (currentMes === 12) {
            currentMes = 1;
            currentAno++;
        } else {
            currentMes++;
        }
    }
    return lista;
}
