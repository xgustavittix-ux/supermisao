$git = "C:\Users\julia\AppData\Local\Programs\MinGit\cmd\git.exe"

# 1. Configurar usuário padrão se não existir
& $git config --global user.name "xgustavittix-ux"
& $git config --global user.email "juliaxavierparreira@gmail.com"
& $git config --global safe.directory "c:/Users/julia/OneDrive/Desktop/Gustavix"

# 2. Inicializar se necessário
if (-not (Test-Path ".git")) {
    & $git init
}

# 3. Configurar branch e remote
& $git branch -M main
$remoteUrl = "https://github.com/xgustavittix-ux/supermisao.git"
$remotes = & $git remote
if ($remotes -contains "origin") {
    & $git remote set-url origin $remoteUrl
} else {
    & $git remote add origin $remoteUrl
}

# 4. Status e Add
& $git status
& $git add .
& $git commit -m "feat: Super Missões Gustavitti v1.0.0 (pronto para Render)"

# 5. Push
Write-Output "Iniciando push para origin main..."
& $git push -u origin main
