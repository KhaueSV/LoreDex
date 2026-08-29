<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- Aqui mudamos o nome da aba e colocamos a sua logo! -->
    <title>LoreDex</title>
    <link rel="icon" type="image/png" href="/logo.png">

    @viteReactRefresh
    @vite('resources/js/app.jsx')

    <!-- Adicionando um fundo global bem bonito e barra de rolagem estilizada -->
    <style>
        body {
            margin: 0;
            padding: 0;
            /* Gradiente escuro elegante (Azul meia-noite para Roxo escuro) */
            background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            color: #f8fafc;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            min-height: 100vh;
            background-attachment: fixed;
        }
        /* Estilizando a barra de rolagem (Scrollbar) */
        ::-webkit-scrollbar { width: 10px; }
        ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 5px; }
        ::-webkit-scrollbar-thumb:hover { background: #4f46e5; }
    </style>
</head>
<body>
    <div id="app"></div>
</body>
</html>