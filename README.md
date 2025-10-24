# Pastoral Juvenil de Rolândia — Site Estático

Este é um site estático em HTML/CSS/JS para a Pastoral Juvenil de Rolândia, contendo duas abas principais:
- **Yeshua** (cores: laranja e preto; símbolo: leão) — encontros: sábados às 18:00
- **Dom** (cores: verde e preto) — encontros: domingos às 20:00 (após a missa)

O site é Single-Page (seções trocadas por JavaScript). Possui:
- Página inicial com resumo e próximos eventos
- Páginas do Yeshua e Dom com descrição, horários, eventos e galeria
- Calendário automático que gera próximas datas recorrentes
- Galeria com imagens de placeholder (SVG)

Como abrir
1. Abra a pasta no seu computador
2. Abra `index.html` em um navegador moderno (Chrome, Edge, Firefox)

Observações
- As imagens na pasta `images/` são placeholders SVG — substitua por fotos reais copiando-as para essa pasta e atualizando as tags `<img>` no HTML se desejar.
- O calendário gera próximas ocorrências automaticamente com base na data atual do navegador.

Se quiser, posso:
- Gerar markup separado por páginas (arquivos diferentes em vez de SPA)
- Adicionar um formulário de contato funcional (requer servidor)
- Inserir integração com Google Calendar (requer API keys)
