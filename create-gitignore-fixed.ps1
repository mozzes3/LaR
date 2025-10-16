# PowerShell Script to Create .gitignore Files
# Run this in the root of your project

Write-Host "Creating .gitignore files..." -ForegroundColor Yellow
Write-Host ""

# Root .gitignore content
$rootContent = @'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment Variables
.env
.env.*
!.env.example
.env.local
.env.development
.env.test
.env.production

# Logs
logs/
*.log
npm-debug.log*

# OS Files
.DS_Store
Thumbs.db
desktop.ini
*.swp

# IDE
.vscode/
.idea/
*.suo
*.sln

# Build
dist/
build/
out/

# Cache
.cache/
.eslintcache

# Uploads
uploads/
temp/
tmp/

# Secrets
*.key
*.pem
secrets/
'@

# Backend .gitignore content
$backendContent = @'
node_modules/
.env
.env.local
.env.production
*.log
logs/
uploads/
temp/
tmp/
dist/
build/
.DS_Store
Thumbs.db
.vscode/
.idea/
'@

# Frontend .gitignore content
$frontendContent = @'
node_modules/
.env
.env.local
.env.production
*.log
dist/
build/
.next/
.vite/
.cache/
.DS_Store
Thumbs.db
.vscode/
.idea/
'@

# Create the files
try {
    Set-Content -Path ".gitignore" -Value $rootContent -ErrorAction Stop
    Write-Host "[OK] Created .gitignore" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create .gitignore" -ForegroundColor Red
}

try {
    Set-Content -Path "backend\.gitignore" -Value $backendContent -ErrorAction Stop
    Write-Host "[OK] Created backend\.gitignore" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create backend\.gitignore" -ForegroundColor Red
}

try {
    Set-Content -Path "frontend\.gitignore" -Value $frontendContent -ErrorAction Stop
    Write-Host "[OK] Created frontend\.gitignore" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to create frontend\.gitignore" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Red
Write-Host "CRITICAL: Your secrets are PUBLIC!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Red
Write-Host ""
Write-Host "Follow these steps NOW:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Generate new JWT_SECRET:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   node -e `"console.log(require('crypto').randomBytes(64).toString('hex'))`"" -ForegroundColor White
Write-Host ""
Write-Host "2. Change MongoDB password:" -ForegroundColor Cyan
Write-Host "   https://cloud.mongodb.com" -ForegroundColor White
Write-Host ""
Write-Host "3. Remove sensitive files from Git:" -ForegroundColor Cyan
Write-Host "   cd .." -ForegroundColor White
Write-Host "   git rm -r --cached ." -ForegroundColor White
Write-Host "   git add ." -ForegroundColor White
Write-Host "   git commit -m `"Add .gitignore and remove sensitive files`"" -ForegroundColor White
Write-Host "   git push origin main --force" -ForegroundColor White
Write-Host ""
Write-Host "4. Verify (should see nothing):" -ForegroundColor Cyan
Write-Host "   git status | Select-String `".env`"" -ForegroundColor White
Write-Host ""