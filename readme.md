<div align="center">

<h1>🎵 Treino Auditivo Musical (MVP)</h1>
<p>Aplicação web (somente frontend por enquanto) para praticar percepção de <strong>intervalos musicais</strong>.</p>

</div>

## ✨ Status

MVP focado em dois exercícios:

- Identificação de Intervalos (ascendente / descendente)
- Comparação de Intervalos (qual é maior / se iguais)

Não há backend implementado ainda. Todos os dados são voláteis (memória do navegador).

## 🧠 Objetivo

Fornecer uma base sólida e acessível para expandir futuramente para outros tipos de treino (escalas, acordes, padrões rítmicos) e então adicionar persistência (progresso, perfil, adaptação).

## 🖥 Tecnologias (atual)

| Área     | Stack |
|----------|-------|
| Frontend | Angular 17 (standalone), Angular Material, Web Audio + SoundFont |
| Build    | Angular CLI |

Sem backend ativo (nenhum serviço Spring Boot rodando / necessário).

## 📂 Estrutura (resumida)

```
frontend/
	src/app/
		pages/

			interval-comparator/
			interval-identification/
		shared/
			answer-grid/
		components/
			footer/
readme.md
```

## ▶️ Rodando localmente

Pré-requisitos: Node LTS (18+), npm.

```bash
cd frontend
npm install
npm start
```

Acessar: http://localhost:4200

## 🎯 Funcionalidades atuais

- Reprodução de intervalos usando SoundFont
- Auto-envio da resposta ao selecionar opção
- Feedback imediato (correto / incorreto + detalhes)
- Atalhos de teclado (Enter, R, N)
- Layout responsivo + foco em acessibilidade básica

## ♿ Acessibilidade (baseline)

- Hierarquia de cabeçalhos consistente
- Skip link para conteúdo principal
- Controles com rótulos claros
- Foco visível (outline personalizado)

Melhorias planejadas: gerenciamento de foco ao trocar de rota, checagem automática com axe, ajustes de contraste.

## 🗺 Roadmap curto (frontend primeiro)

1. Escalas (identificação)  
2. Acordes (tríades)  
3. Modo adaptativo (mais repetições no que erra)  
4. Tema escuro + PWA  
5. Backend (persistência de progresso / autenticação) — futuro

## 🤝 Contribuindo

1. Fork & branch: `feat/nome-funcionalidade`  
2. Seguir estilo do Angular + lint padrão  
3. Pull Request com descrição clara

Sugestões e feedback via Issues são bem-vindos.

## 📄 Licença

Ainda não definida (uso educacional / experimental). Será formalizada antes do backend.

## 🙋 Autor

João Victor Fernandes Mendes

---

Se quiser sugerir novos tipos de exercícios ou melhorias de UX, abra uma issue. Bom treino! 🎶

