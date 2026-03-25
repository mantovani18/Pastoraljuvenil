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

## Inscrição de eventos com Google Sheets

O site agora possui formulário de inscrição no modal de evento, com os campos:
- Nome
- Idade
- Número
- Alergia
- Comprovante de pagamento (arquivo)

Também foi trocado o botão flutuante para WhatsApp do Leonardo Mantovani.

### 1. Criar a planilha

Crie uma planilha no Google Sheets com as colunas abaixo (linha 1):

`DataHoraEnvio | Evento | DataEvento | Grupo | Pago | PIX | Valor | Nome | Idade | Numero | Alergia | Comprovante`

### 2. Criar Apps Script

No Google Sheets, abra `Extensões > Apps Script` e use este código:

```javascript
const SHEET_NAME = 'Página1';

function doPost(e) {
	try {
		const body = JSON.parse(e.postData.contents || '{}');
		const ss = SpreadsheetApp.getActiveSpreadsheet();
		const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

		let comprovanteLink = '';

		if (body.comprovanteBase64 && body.comprovanteNome) {
			const folder = DriveApp.getRootFolder();
			const bytes = Utilities.base64Decode(body.comprovanteBase64);
			const blob = Utilities.newBlob(bytes, body.comprovanteMimeType || 'application/octet-stream', body.comprovanteNome);
			const file = folder.createFile(blob);
			file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
			comprovanteLink = file.getUrl();
		}

		sheet.appendRow([
			new Date(),
			body.evento || '',
			body.dataEvento || '',
			body.grupo || '',
			body.pago || 'Não',
			body.pix || '',
			body.valor || '',
			body.nome || '',
			body.idade || '',
			body.numero || '',
			body.alergia || '',
			comprovanteLink
		]);

		return ContentService
			.createTextOutput(JSON.stringify({ ok: true }))
			.setMimeType(ContentService.MimeType.JSON);
	} catch (err) {
		return ContentService
			.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
			.setMimeType(ContentService.MimeType.JSON);
	}
}
```

### 3. Publicar o script

1. Clique em `Implantar > Nova implantação`
2. Tipo: `Aplicativo da Web`
3. `Executar como`: você
4. `Quem tem acesso`: qualquer pessoa com o link
5. Copie a URL da implantação

### 4. Configurar no site

No arquivo `script.js`, preencha a constante:

`const GOOGLE_SCRIPT_URL = 'COLE_AQUI_A_URL_DO_WEB_APP';`

### 5. Configurar quais eventos são pagos

No `script.js`, ajuste o objeto `EVENT_RULES`:

```javascript
const EVENT_RULES = {
	yeshua: { paid: true, amount: '35,00' },
	dom: { paid: false, amount: '' },
	pastoral: { paid: true, amount: '50,00' }
};
```

Quando `paid: true`, o formulário exige comprovante e mostra PIX + valor na inscrição.
