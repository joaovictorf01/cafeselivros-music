## Treino Auditivo Musical

Aplicação web simples para praticar percepção auditiva de intervalos musicais.

### Objetivo
Fornecer exercícios rápidos (identificação e comparação de intervalos) com feedback imediato e áudio de piano via SoundFont. Sem limites diários: a ideia é treinar livremente.

### Funcionalidades atuais
- Identificação de intervalos (ouça e escolha a opção correta)
- Comparação de dois intervalos (qual é maior ou se são iguais)
- Feedback de acerto/erro com som de sucesso
- Áudio usando Web Audio + SoundFont (fallback para onda senoidal se falhar)
- Suporte a SSR / execução segura sem quebrar em ambiente de servidor
- Dashboard simples com estatísticas (tentativas, acertos, taxa)

### Tecnologias
- Angular 17 (standalone components, novos controles de fluxo @if/@for)
- Angular Material (botões, cards, ícones)
- Web Audio API + soundfont-player
- TypeScript 5
- Nginx (deploy estático sugerido)

### Estrutura básica
```
src/app/
	pages/
		training-dashboard/
		interval-identification/
		interval-comparator/
	services/
		audio.service.ts
		daily-limit.service.ts (mantido apenas para estatísticas locais)
```

### Desenvolvimento
Inicie servidor de desenvolvimento:
```
npm install
npm start
```
Acesse: http://localhost:4200

### Build produção
```
npm run build
```
Saída principal (estático): `dist/frontend/browser/`

### Deploy estático (exemplo Nginx)
Server block típico:
```
server {
	server_name seu-dominio.com;
	root /var/www/treino;      # apontar para dist/frontend/browser
	index index.html;
	location / {
		try_files $uri $uri/ /index.html;
	}
	location ~* \.(?:js|css|woff2?|svg|png|jpg|ico)$ {
		add_header Cache-Control "public, max-age=31536000, immutable";
	}
}
```

### CI/CD (GitHub Actions)
Workflow em `.github/workflows/deploy.yml`:
- Build produção
- rsync para servidor via SSH
- Ajusta permissões e recarrega Nginx

Secrets esperados:
`SSH_HOST`, `SSH_USER`, `SSH_KEY`, `TARGET_DIR` (ex: /var/www/treino)

### Próximas ideias (roadmap)
- Ampliar conjunto de intervalos (6ª, 7ª, trítono)
- Modo “pitch absoluto” opcional
- Histórico persistido em backend próprio (futuro: Spring API)
- Slider de volume e seleção de oitava
- Repetição espaçada (mais foco nos intervalos com erro)

### Áudio: notas baixas / volume
O serviço de áudio possui master gain + compressor. Caso queira ajustar manualmente edite `audio.service.ts` (propriedade `volume` e gains nas chamadas `play`).

### Contribuição
Projeto pessoal em evolução. Sugestões ou issues são bem-vindas.

### Licença
Uso educativo / pessoal. Defina uma licença formal (ex: MIT) se for abrir contribuições externas.

