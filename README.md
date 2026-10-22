# Penseira

App pessoal (PWA) para usar no celular e no computador: frase do momento, metas diárias,
frentes de trabalho, agenda e a **penseira** — pensamentos flutuando que se organizam sozinhos.

- **Hoje**: dashboard com frase, metas, compromissos, prioridades, frentes e pensamentos.
- **Penseira**: jogue ideias soltas (texto ou voz). Ele classifica em Fazer / Ideia / Dúvida / Lembrar / Frase / Reflexão; `#tags` ligam à frente certa; "Organizar" vira tarefas.
- **Frentes**: tarefas por frente de trabalho, com prazo e prioridade ⭐.
- **Agenda**: compromissos + prazos das tarefas.
- **Frases**: suas frases importantes; uma aparece por vez e pode virar notificação ao longo do dia.

Funciona offline. Os dados ficam no aparelho (localStorage); use **Ajustes → Exportar/Importar** para levar de um aparelho a outro.

## Rodar / instalar
Servir a pasta com qualquer servidor estático (`python3 -m http.server`). Com o GitHub Pages ativo
(Settings → Pages → Source: GitHub Actions) o app fica em `https://<usuario>.github.io/penseira/` e pode ser instalado
pelo navegador ("Instalar app" / "Adicionar à Tela de Início").

Sem dependências nem build: `index.html`, `styles.css`, `app.js`, `sw.js`.
