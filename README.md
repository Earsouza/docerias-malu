# Quadro Kanban de atendimentos (Firebase)

Quadro compartilhado em tempo real: quando alguém cria, edita ou move uma tarefa, todos veem na hora.

## 1. Criar o projeto no Firebase
1. Acesse https://console.firebase.google.com e crie um projeto.
2. Em **Configurações do projeto > Seus apps**, adicione um app **Web** (`</>`) e copie o objeto `firebaseConfig`.
3. Cole os valores em `firebase-config.js`.

## 2. Ativar o banco de dados
1. **Build > Firestore Database > Criar banco de dados** (modo produção, escolha uma região, por exemplo `southamerica-east1`).
2. Aba **Regras**: cole o conteúdo de `firestore.rules` e clique em **Publicar**.

## 3. Ativar o login
1. **Build > Authentication > Primeiros passos > E-mail/senha > Ativar**.
2. Aba **Usuários > Adicionar usuário**: cadastre e-mail e senha de cada pessoa da equipe.
   (O site não tem cadastro aberto: só entra quem você criar aqui.)

## 4. Executar
- **Localmente:** o navegador bloqueia módulos ES em `file://`. Use um servidor local na pasta do projeto:
  `python3 -m http.server 8080` e abra http://localhost:8080
  (ou a extensão Live Server do VS Code).
- **GitHub Pages:** envie os arquivos para o repositório e ative o Pages. Depois, em
  **Authentication > Configurações > Domínios autorizados**, adicione `SEU-USUARIO.github.io`.

## 5. Dados de exemplo
Com o quadro vazio, use **Adicionar exemplos** no menu lateral.

## Observações
- A `apiKey` do Firebase pode ficar no código público; a segurança vem do login e das regras do Firestore.
- Os dados ficam em cache no navegador: se a conexão cair, o quadro continua abrindo e sincroniza ao voltar.
- Tarefas estão na coleção `tasks`, com os campos: title, client, sms, desc, owner, priority, category, status, order, createdAt, createdBy, updatedBy.
