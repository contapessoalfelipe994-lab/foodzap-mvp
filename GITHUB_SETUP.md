# 📤 Guia para Enviar para o GitHub

## Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name**: `foodzap-mvp` (ou o nome que preferir)
   - **Description**: "Sistema completo de gestão de pedidos online para restaurantes"
   - **Visibility**: Escolha Public ou Private
   - **NÃO marque** "Initialize with README" (já temos um)
3. Clique em **"Create repository"**

### 2. Conectar e Enviar

Após criar o repositório, execute os seguintes comandos no terminal (substitua `SEU-USUARIO` pelo seu usuário do GitHub):

```bash
git remote add origin https://github.com/SEU-USUARIO/foodzap-mvp.git
git branch -M main
git push -u origin main
```

### 3. Alternativa - Usando SSH

Se você preferir usar SSH (requer chave SSH configurada):

```bash
git remote add origin git@github.com:SEU-USUARIO/foodzap-mvp.git
git branch -M main
git push -u origin main
```

## ✅ Pronto!

Após executar os comandos, seu código estará no GitHub!

Você pode acessar em: `https://github.com/SEU-USUARIO/foodzap-mvp`

## 🔄 Atualizações Futuras

Para enviar atualizações futuras:

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```
