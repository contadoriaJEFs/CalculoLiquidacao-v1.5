// =====================================================================
// APLICAÇÃO – INICIALIZAÇÃO, NAVEGAÇÃO, EVENTOS
// =====================================================================

function ativarGuia(nomeGuia) {
    const botoes = document.querySelectorAll('.nav-guia button');
    const conteudos = document.querySelectorAll('.conteudo-guia');
    botoes.forEach(btn => {
        btn.classList.toggle('ativo', btn.dataset.guia === nomeGuia);
    });
    conteudos.forEach(div => {
        div.classList.toggle('ativo', div.id === 'guia-' + nomeGuia);
    });

    // === CORREÇÃO: Montar a Guia 4 ao acessar a aba Diferenças ===
    if (nomeGuia === 'diferencas') {
        if (typeof montarTabelaDiferencas === 'function') {
            montarTabelaDiferencas();
        }
    }
}

// Eventos de navegação
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-guia button').forEach(btn => {
        btn.addEventListener('click', function(e) {
            ativarGuia(this.dataset.guia);
        });
    });

    // Eventos dos cadeados – delegado
    document.addEventListener('click', function(e) {
        const cadeado = e.target.closest('.cadeado');
        if (cadeado) {
            e.preventDefault();
            alternarModoTermoInicial(cadeado);
        }
    });

    // Sincronização dos campos manuais – CORRIGIDO
    document.querySelectorAll('#termoInicialDiferencas, #termoInicialDiferencas2').forEach(el => {
        if (el) {
            el.addEventListener('input', function() {
                if (termoInicialManual) {
                    sincronizarTermoInicial(this);
                }
            });
            // Removida a chamada a aplicarMascaraData(this, true) no blur
            el.addEventListener('blur', function() {
                if (termoInicialManual) {
                    // Apenas sincroniza, sem aplicar máscara forçada
                    sincronizarTermoInicial(this);
                }
            });
        }
    });

    // Gatilhos para recalcular termo automático
    ['dib', 'dataAjuizamento', 'aplicarPrescricao', 'prazoPrescricional'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', function() {
                if (!termoInicialManual) calcularTermoInicial();
            });
            if (el.tagName === 'INPUT') {
                el.addEventListener('input', function() {
                    if (!termoInicialManual) {
                        const dibVal = document.getElementById('dib').value;
                        const ajuizVal = document.getElementById('dataAjuizamento').value;
                        if (dibVal.length >= 6 && (document.getElementById('aplicarPrescricao').value === 'nao' || ajuizVal.length >= 8)) {
                            calcularTermoInicial();
                        }
                    }
                });
            }
        }
    });

    // Sincronização Data de Atualização → Data Final
    const dataFinal = document.getElementById('dataFinal');
    if (dataFinal) {
        dataFinal.addEventListener('input', function() {
            if (this.value.length === 7) {
                dataFinalAlteradaManualmente = true;
            }
        });
    }
    const dataAtualizacao = document.getElementById('dataAtualizacao');
    if (dataAtualizacao) {
        dataAtualizacao.addEventListener('input', sincronizarDataFinal);
    }

    // === CORREÇÃO: Inicializar a Guia 4 ===
    if (typeof initGuiaDiferencas === 'function') {
        initGuiaDiferencas();
    }

    // Inicialização
    toggleFonteIndices();
    preencherDataAtual();
    ativarGuia('entradas');
    adicionarBeneficioRecebido();
    onTipoAcaoChange();

    // Prescrição padrão
    document.getElementById('aplicarPrescricao').value = 'sim';
    document.getElementById('prazoPrescricional').value = 5;

    // Fecha cadeados
    document.querySelectorAll('.cadeado').forEach(el => {
        el.classList.remove('aberto');
        el.classList.add('fechado');
        el.textContent = '🔒';
    });
    document.querySelectorAll('#termoInicialDiferencas, #termoInicialDiferencas2').forEach(el => {
        if (el) {
            el.readOnly = true;
            el.classList.remove('bg-white');
            el.classList.add('bg-slate-50');
        }
    });
    termoInicialManual = false;
    calcularTermoInicial();

    // Se a guia atual for "diferencas" (ex: recarregar a página com a guia ativa), montar a tabela
    const guiaAtiva = document.querySelector('.nav-guia button.ativo');
    if (guiaAtiva && guiaAtiva.dataset.guia === 'diferencas') {
        if (typeof montarTabelaDiferencas === 'function') {
            montarTabelaDiferencas();
        }
    }
});

// =====================================================================
// FUNÇÃO SINCORNIZAR TERMO INICIAL – CORRIGIDA
// =====================================================================

function sincronizarTermoInicial(campoOrigem) {
    if (!termoInicialManual) return;
    const valor = campoOrigem.value.trim();

    // Aceita MM/AAAA ou DD/MM/AAAA
    const regexMMAAAA = /^\d{2}\/\d{4}$/;
    const regexDDMMAAAA = /^\d{2}\/\d{2}\/\d{4}$/;

    // Se estiver vazio, sincroniza como vazio
    if (valor === '') {
        const outro = campoOrigem.id === 'termoInicialDiferencas' ?
            document.getElementById('termoInicialDiferencas2') :
            document.getElementById('termoInicialDiferencas');
        if (outro && outro.value !== valor) {
            outro.value = valor;
        }
        estadoTermoInicial.valor = valor;
        return;
    }

    // Tenta normalizar se for apenas números
    let valorNormalizado = valor;
    if (/^\d+$/.test(valor)) {
        // Se tem 6 dígitos -> MMAAAA -> MM/AAAA
        if (valor.length === 6) {
            valorNormalizado = valor.substring(0, 2) + '/' + valor.substring(2);
        }
        // Se tem 8 dígitos -> DDMMAAAA -> DD/MM/AAAA
        else if (valor.length === 8) {
            valorNormalizado = valor.substring(0, 2) + '/' + valor.substring(2, 4) + '/' + valor.substring(4);
        }
    }

    // Valida se está em um dos formatos aceitos
    if (!regexMMAAAA.test(valorNormalizado) && !regexDDMMAAAA.test(valorNormalizado)) {
        // Se inválido, não prossegue
        return;
    }

    // === CORREÇÃO: Atualiza o próprio campo de origem com o valor normalizado ===
    if (campoOrigem.value !== valorNormalizado) {
        campoOrigem.value = valorNormalizado;
    }

    // Sincroniza o outro campo com o mesmo valor
    const outro = campoOrigem.id === 'termoInicialDiferencas' ?
        document.getElementById('termoInicialDiferencas2') :
        document.getElementById('termoInicialDiferencas');
    if (outro && outro.value !== valorNormalizado) {
        outro.value = valorNormalizado;
    }

    // Atualiza o estado global com o valor preservado
    estadoTermoInicial.valor = valorNormalizado;
    estadoTermoInicial.manual = true;
    estadoTermoInicial.origem = 'manual';
}
